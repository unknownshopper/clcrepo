import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Definimos las categorías de sucursales
const branchCategories = {
    main: ['Altabrisa', 'Américas', 'Ángeles', 'Centro', 'Cristal', 'Deportiva', 'Galerías', 'Guayabal', 'Olmeca', 'USUMA'],
    express: ['Pista', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'],
    mobile: ['Móvil Deportiva', 'Móvil La Venta']
};

// Función para calcular promedios
function average(arr) {
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// Función para crear la gráfica principal
function createMainChart(percentages) {
    const ctx = document.getElementById('branchesChart');
    const mainAvg = average(branchCategories.main.map((_, i) => parseInt(percentages[i])));
    const expressAvg = average(branchCategories.express.map((_, i) => parseInt(percentages[i + branchCategories.main.length])));
    const mobileAvg = average(branchCategories.mobile.map((_, i) => parseInt(percentages[i + branchCategories.main.length + branchCategories.express.length])));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sucursales', 'Exprés', 'Móviles'],
            datasets: [{
                label: 'Promedio por Categoría',
                data: [mainAvg, expressAvg, mobileAvg],
                backgroundColor: [mainAvg, expressAvg, mobileAvg].map(score => {
                    if (score >= 95) return '#4CAF50';
                    if (score >= 90) return '#FFC107';
                    return '#F44336';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Función para crear gráficas por categoría
function createCategoryChart(canvasId, branches, allPercentages) {
    const ctx = document.getElementById(canvasId);
    const branchIndices = branches.map(branch => 
        [...branchCategories.main, ...branchCategories.express, ...branchCategories.mobile].indexOf(branch)
    );
    const categoryPercentages = branchIndices.map(index => parseInt(allPercentages[index]));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: branches,
            datasets: [{
                label: 'Porcentaje de Evaluación',
                data: categoryPercentages,
                backgroundColor: categoryPercentages.map(p => {
                    if (p >= 95) return '#4CAF50';
                    if (p >= 90) return '#FFC107';
                    return '#F44336';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 30
                }
            }
        }
    });
}

// Función para crear la gráfica general
function createGeneralChart(percentages) {
    const ctx = document.getElementById('generalChart');
    const allBranches = [...branchCategories.main, ...branchCategories.express, ...branchCategories.mobile];
    
    // Obtener los resultados por sucursal
    const branchResults = allBranches.map((branch, index) => {
        const value = parseInt(percentages[index]);
        return {
            branch: branch,
            result: value,
            score: value > 30 ? (value / 100 * 30).toFixed(1) : value
        };
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allBranches,
            datasets: [{
                label: 'Resultado por Sucursal',
                data: branchResults.map(b => b.score),
                backgroundColor: branchResults.map(b => {
                    const result = b.result;
                    if (result >= 95) return '#4CAF50';
                    if (result >= 90) return '#FFC107';
                    return '#F44336';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 30,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const branchData = branchResults[context.dataIndex];
                            return `${branchData.branch}: ${branchData.result}%`;
                        }
                    }
                }
            }
        }
    });
}

// Modificar el evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            console.log('Datos cargados:', docData);
            
            if (docData.porcentajes) {
                createMainChart(docData.porcentajes);
                createCategoryChart('mainBranchesChart', branchCategories.main, docData.porcentajes);
                createCategoryChart('expresBranchesChart', branchCategories.express, docData.porcentajes);
                createCategoryChart('mobileBranchesChart', branchCategories.mobile, docData.porcentajes);
                createGeneralChart(docData.porcentajes); // Agregamos esta línea
            }
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});


// Función para obtener datos de scores.html
async function getScoresData() {
    try {
        const response = await fetch('scores.html');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const scores = {};
        const rows = doc.querySelectorAll('table tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const branchName = cells[0].textContent.trim();
                const score = parseInt(cells[1].textContent);
                if (!isNaN(score)) {
                    scores[branchName] = score;
                }
            }
        });
        
        return scores;
    } catch (error) {
        console.error("Error loading scores:", error);
        return null;
    }
}

// Modificar el evento principal
document.addEventListener('DOMContentLoaded', async () => {
    const scores = await getScoresData();
    if (!scores) return;

    // Función para calcular porcentajes de la tabla
    function calculateBranchScores() {
        const table = document.querySelector('table');
        const scores = {};
        
        // Obtener índices de las columnas para cada sucursal
        const headers = Array.from(table.querySelectorAll('thead th'));
        const branchIndices = {};
        headers.forEach((header, index) => {
            if (index > 0) { // Ignorar la primera columna (Parámetros)
                branchIndices[header.textContent.trim()] = index;
            }
        });
    
        // Obtener los porcentajes de la última fila
        const percentagesRow = table.querySelector('.percentages');
        if (percentagesRow) {
            const cells = percentagesRow.querySelectorAll('td');
            Object.keys(branchIndices).forEach(branch => {
                const index = branchIndices[branch];
                const percentText = cells[index].textContent;
                scores[branch] = parseInt(percentText);
            });
        }
    
        return scores;
    }
    
    // Función para destruir gráficas existentes
    function destroyCharts() {
        ['branchesChart', 'mainBranchesChart', 'expresBranchesChart', 'mobileBranchesChart', 'generalChart'].forEach(id => {
            const chart = Chart.getChart(id);
            if (chart) chart.destroy();
        });
    }
    
    // Función para calcular porcentajes
    // Función para calcular los puntajes de cada sucursal
    function calculateBranchScores() {
        const table = document.querySelector('table');
        if (!table) return {};
        
        const scores = {};
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const headers = Array.from(table.querySelectorAll('thead th'));
        
        for (let colIndex = 1; colIndex < headers.length; colIndex++) {
            const branchName = headers[colIndex].textContent.trim();
            let total = 0;
            
            rows.forEach(row => {
                const cell = row.querySelectorAll('td')[colIndex];
                if (cell) {
                    total += parseInt(cell.textContent) || 0;
                }
            });
            
            // Calcular el porcentaje basado en el total de preguntas
            scores[branchName] = Math.round((total / rows.length) * 100);
        }
        
        return scores;
    }
    
    // Función para destruir gráficas existentes
    function destroyCharts() {
        ['branchesChart', 'mainBranchesChart', 'expresBranchesChart', 'mobileBranchesChart', 'generalChart'].forEach(id => {
            const chart = Chart.getChart(id);
            if (chart) chart.destroy();
        });
    }
    
    // Función para obtener el orden y scores de las sucursales
    // Función para obtener los datos de la tabla
    function getBranchScores() {
        const table = document.querySelector('table');
        if (!table) return { scores: {}, order: [] };
        
        const headers = Array.from(table.querySelectorAll('thead th'));
        const lastRow = table.querySelector('tr:last-child');
        const branchOrder = headers.slice(1).map(th => th.textContent.trim());
        const scores = {};
        
        if (lastRow) {
            const cells = lastRow.querySelectorAll('td');
            branchOrder.forEach((branch, index) => {
                const percentText = cells[index + 1]?.textContent || '0';
                scores[branch] = parseInt(percentText.replace('%', '')) || 0;
            });
        }
        
        return { scores, order: branchOrder };
    }
    
    // Un solo evento DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        try {
            destroyCharts();
            const { scores, order } = getBranchScores();
            
            // Filtrar sucursales por categoría manteniendo el orden original
            const mainBranches = order.filter(branch => branchCategories.main.includes(branch));
            const expressBranches = order.filter(branch => branchCategories.express.includes(branch));
            const mobileBranches = order.filter(branch => branchCategories.mobile.includes(branch));
            
            // Obtener porcentajes en el orden de la tabla
            const percentages = order.map(branch => scores[branch]);
    
            createMainChart(percentages);
            createCategoryChart('mainBranchesChart', mainBranches, percentages);
            createCategoryChart('expresBranchesChart', expressBranches, percentages);
            createCategoryChart('mobileBranchesChart', mobileBranches, percentages);
            createGeneralChart(percentages);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    });
});
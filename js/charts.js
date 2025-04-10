import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Definición de categorías
const branchCategories = {
    main: ['Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 'Galerias', 'Guayabal', 'Olmeca', 'USUMA'],
    express: ['Pista', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'],
    mobile: ['Movil Deportiva', 'Movil La Venta']
};

// Un solo evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Iniciando carga de gráficas...');
        
        // Verificar Chart.js
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js no está cargado');
        }

        // Verificar que existan todos los canvas
        const canvasIds = ['branchesChart', 'sucursalesBranchesChart', 'expresBranchesChart', 'mobileBranchesChart', 'generalChart'];
        for (const id of canvasIds) {
            const canvas = document.getElementById(id);
            if (!canvas) {
                throw new Error(`Canvas ${id} no encontrado`);
            }
        }

        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('No hay datos en Firebase');
        }

        const docData = querySnapshot.docs[0].data();
        console.log('Datos recibidos:', docData);
        
        const scores = {};
        const todasLasSucursales = [
            ...branchCategories.main,
            ...branchCategories.express,
            ...branchCategories.mobile
        ];

        // Usar el array totales directamente
        const totales = docData.totales || [];
        
        // Mapear los valores correctamente
        const ordenCorrecto = [
            'Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 'Galerias', 'Guayabal', 'Movil Deportiva', 'Movil La Venta', 'Olmeca', 'Pista', 'USUMA', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'
        ];

        // Función para convertir a porcentaje (30 puntos = 100%)
        const convertToPercentage = (value) => Math.round((value / 28) * 100);

        ordenCorrecto.forEach((sucursal, index) => {
            if (totales[index] !== undefined) {
                scores[sucursal] = convertToPercentage(parseInt(totales[index]));
            }
        });

        console.log('Scores procesados (en porcentaje):', scores);

        // Crear las gráficas una por una
        try {
            createGeneralChart(todasLasSucursales, scores);
            createMainChart(todasLasSucursales, scores);
            createCategoryChart('sucursalesBranchesChart', branchCategories.main, scores);
            createCategoryChart('expresBranchesChart', branchCategories.express, scores);
            createCategoryChart('mobileBranchesChart', branchCategories.mobile, scores);
            console.log('Gráficas creadas exitosamente');
        } catch (error) {
            console.error('Error creando gráficas:', error);
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
});

// Modificar las funciones de creación de gráficas para que sean asíncronas
function createMainChart(order, scores) {
    const canvas = document.getElementById('branchesChart');
    if (!canvas) {
        console.error('Canvas branchesChart no encontrado');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    const mainBranches = branchCategories.main.filter(b => scores[b] !== undefined);
    const expressBranches = branchCategories.express.filter(b => scores[b] !== undefined);
    const mobileBranches = branchCategories.mobile.filter(b => scores[b] !== undefined);

    const mainAvg = mainBranches.length ? average(mainBranches.map(b => scores[b])) : 0;
    const expressAvg = expressBranches.length ? average(expressBranches.map(b => scores[b])) : 0;
    const mobileAvg = mobileBranches.length ? average(mobileBranches.map(b => scores[b])) : 0;

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

// Aplicar el mismo patrón a createCategoryChart y createGeneralChart
function createCategoryChart(canvasId, branches, scores) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas ${canvasId} no encontrado`);
        return;
    }
    ctx.parentElement.className = `chart-wrapper-${canvasId}`;
    
    const categoryPercentages = branches.map(branch => scores[branch] || 0);

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
            maintainAspectRatio: true, // Cambiar a true
            aspectRatio: 2, // Agregar ratio fijo
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createGeneralChart(order, scores) {
    const ctx = document.getElementById('generalChart');
    if (!ctx) {
        console.error('Canvas generalChart no encontrado');
        return;
    }
    
    // Crear array de objetos para mantener la relación nombre-valor
    const branchResults = order.map(branch => ({
        branch: branch,
        result: scores[branch] || 0,
        score: scores[branch] || 0
    }));

    // Ordenar alfabéticamente solo los nombres para las etiquetas
    const sortedLabels = order.slice().sort();
    
    // Reordenar los valores para que coincidan con el orden alfabético
    const sortedResults = sortedLabels.map(label => 
        branchResults.find(b => b.branch === label)
    );

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Resultado por Sucursal',
                data: sortedResults.map(b => b.score),
                backgroundColor: sortedResults.map(b => {
                    const result = b.result;
                    if (result >= 95) return '#4CAF50';
                    if (result >= 90) return '#FFC107';
                    return '#F44336';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
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
                }
            }
        }
    });
}

function average(arr) {
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
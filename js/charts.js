import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const branchCategories = {
    main: ['Altabrisa', 'Américas', 'Ángeles', 'Centro', 'Cristal', 'Deportiva', 'Galerías', 'Guayabal', 'Olmeca', 'USUMA'],
    express: ['Pista', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'],
    mobile: ['Móvil Deportiva', 'Móvil La Venta']
};

async function loadChartData() {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    try {
        const docRef = doc(db, 'evaluaciones', `${year}_${month}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const percentages = data.porcentajes;
            
            createMainChart(percentages);
            createCategoryChart('mainBranchesChart', branchCategories.main, percentages);
            createCategoryChart('expresBranchesChart', branchCategories.express, percentages);
            createCategoryChart('mobileBranchesChart', branchCategories.mobile, percentages);
            createGeneralChart(percentages); // Add this line
        }
    } catch (error) {
        console.error("Error loading chart data:", error);
    }
}

function createMainChart(percentages) {
    const ctx = document.getElementById('branchesChart').getContext('2d');
    
    // Calculate averages for each category
    const mainAvg = average(branchCategories.main.map((_, i) => parseInt(percentages[i])));
    const expressAvg = average(branchCategories.express.map((_, i) => 
        parseInt(percentages[i + branchCategories.main.length])));
    const mobileAvg = average(branchCategories.mobile.map((_, i) => 
        parseInt(percentages[i + branchCategories.main.length + branchCategories.express.length])));

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
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Promedio por Tipo de Sucursal'
                }
            }
        }
    });
}

// Helper function to calculate average
function average(arr) {
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function createCategoryChart(canvasId, branches, allPercentages) {
    const ctx = document.getElementById(canvasId).getContext('2d');
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
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Add this new function
function createGeneralChart(percentages) {
    const ctx = document.getElementById('generalChart').getContext('2d');
    const allBranches = [...branchCategories.main, ...branchCategories.express, ...branchCategories.mobile];
    
    // Log data to check what we're receiving
    console.log('Percentages:', percentages);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allBranches,
            datasets: [{
                label: 'Porcentaje de Evaluación',
                data: percentages.map(p => parseInt(p.replace('%', ''))), // Ensure proper number conversion
                backgroundColor: percentages.map(p => {
                    const score = parseInt(p.replace('%', ''));
                    if (score >= 95) return '#4CAF50';
                    if (score >= 90) return '#FFC107';
                    return '#F44336';
                }),
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
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

document.addEventListener('DOMContentLoaded', loadChartData);
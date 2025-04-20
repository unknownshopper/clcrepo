import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mesesFuturos = [
    { month: 2, year: 2024 }, // Marzo 2024
    { month: 3, year: 2024 }, // Abril 2024
    { month: 4, year: 2024 }, // Mayo 2024
    { month: 5, year: 2024 }, // Junio 2024
    { month: 6, year: 2024 }, // Julio 2024
    { month: 7, year: 2024 }, // Agosto 2024
    { month: 8, year: 2024 }, // Septiembre 2024
    { month: 9, year: 2024 }, // Octubre 2024
    { month: 10, year: 2024 }, // Noviembre 2024
    { month: 11, year: 2024 }, // Diciembre 2024
    { month: 0, year: 2025 }, // Enero 2025
    { month: 1, year: 2025 }, // Febrero 2025
    { month: 2, year: 2025 }, // Marzo 2025
    { month: 3, year: 2025 }  // Abril 2025
];

// Definición de categorías
const branchCategories = {
    main: ['Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 'Galerias', 'Guayabal', 'Olmeca', 'USUMA'],
    express: ['Pista', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'],
    mobile: ['Movil Deportiva', 'Movil La Venta']
};

const getCurrentMonthData = (fechas) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return fechas.find(f => {
        const fecha = new Date(f.timestamp.seconds * 1000);
        return fecha.getMonth() === currentMonth && 
               fecha.getFullYear() === currentYear;
    });
};

// Función para actualizar las gráficas
async function updateCharts(data) {
    if (!data) {
        console.log('No hay datos para mostrar');
        return;
    }

    const scores = {};
    const todasLasSucursales = [
        ...branchCategories.main,
        ...branchCategories.express,
        ...branchCategories.mobile
    ];

    const totales = data.totales || [];
    const ordenCorrecto = [
        'Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 
        'Galerias', 'Guayabal', 'Movil Deportiva', 'Movil La Venta', 'Olmeca', 
        'Pista', 'USUMA', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 
        'Walmart Universidad'
    ];

    const convertToPercentage = (value) => Math.round((value / 28) * 100);

    ordenCorrecto.forEach((sucursal, index) => {
        if (totales[index] !== undefined) {
            scores[sucursal] = convertToPercentage(parseInt(totales[index]));
        }
    });

    // Destruir gráficas existentes antes de crear nuevas
    const chartIds = ['branchesChart', 'sucursalesBranchesChart', 'expresBranchesChart', 'mobileBranchesChart', 'generalChart'];
    chartIds.forEach(id => {
        const chartInstance = Chart.getChart(id);
        if (chartInstance) {
            chartInstance.destroy();
        }
    });

    createGeneralChart(todasLasSucursales, scores);
    createMainChart(todasLasSucursales, scores);
    createCategoryChart('sucursalesBranchesChart', branchCategories.main, scores);
    createCategoryChart('expresBranchesChart', branchCategories.express, scores);
    createCategoryChart('mobileBranchesChart', branchCategories.mobile, scores);
}

// Un solo evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar Chart.js
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js no está cargado');
        }

        const monthYearSelect = document.getElementById('monthYearSelect');
        const fechasUnicas = new Map();
        
        // Agregar fechas futuras al Map
        mesesFuturos.forEach(({ month, year }) => {
            const fecha = new Date(year, month, 1);
            const fechaStr = fecha.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
            });
            fechasUnicas.set(fechaStr, {
                str: fechaStr,
                timestamp: { seconds: fecha.getTime() / 1000 },
                data: null
            });
        });

        // Obtener datos de Firebase
        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fecha) {
                const fecha = new Date(data.fecha.seconds * 1000);
                const fechaStr = fecha.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long' 
                });
                if (fechasUnicas.has(fechaStr)) {
                    fechasUnicas.get(fechaStr).data = data;
                }
            }
        });

        // Convertir a array y ordenar
        const fechas = Array.from(fechasUnicas.values())
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

        // Poblar el selector
        fechas.forEach(fecha => {
            const option = document.createElement('option');
            option.value = fecha.timestamp.seconds;
            option.textContent = fecha.str;
            monthYearSelect.appendChild(option);
        });

        // Event listener para el cambio de mes
        monthYearSelect.addEventListener('change', (e) => {
            const selectedData = fechas.find(f => f.timestamp.seconds.toString() === e.target.value);
            if (selectedData) {
                updateCharts(selectedData.data);
            }
        });

        // Mostrar datos iniciales
        if (fechas.length > 0) {
            const currentMonthData = getCurrentMonthData(fechas);
            if (currentMonthData) {
                monthYearSelect.value = currentMonthData.timestamp.seconds;
                await updateCharts(currentMonthData.data);
            } else {
                monthYearSelect.value = fechas[0].timestamp.seconds;
                await updateCharts(fechas[0].data);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Eliminar el segundo DOMContentLoaded event listener

// Función auxiliar para calcular promedio
function average(arr) {
    return arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0;
}

function createGeneralChart(order, scores) {
    const ctx = document.getElementById('generalChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: order,
            datasets: [{
                label: 'Puntaje General',
                data: order.map(branch => scores[branch] || 0),
                backgroundColor: order.map(branch => {
                    const score = scores[branch] || 0;
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

function createMainChart(order, scores) {
    const ctx = document.getElementById('branchesChart').getContext('2d');
    
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

function createCategoryChart(canvasId, branches, scores) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: branches,
            datasets: [{
                label: 'Puntaje por Sucursal',
                data: branches.map(branch => scores[branch] || 0),
                backgroundColor: branches.map(branch => {
                    const score = scores[branch] || 0;
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
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mesesFuturos = [
    { month: 0, year: 2025 }, // Enero 2025
    { month: 1, year: 2025 }, // Febrero 2025
    { month: 2, year: 2025 }, // Marzo 2025
    { month: 3, year: 2025 }, // Abril 2025
    { month: 4, year: 2025 }, // Mayo 2025
    { month: 5, year: 2025 }, // Junio 2025
    { month: 6, year: 2025 }, // Julio 2025
    { month: 7, year: 2025 }, // Agosto 2025
    { month: 8, year: 2025 }, // Septiembre 2025
    { month: 9, year: 2025 }, // Octubre 2025
    { month: 10, year: 2025 }, // Noviembre 2025
    { month: 11, year: 2025 }  // Diciembre 2025
];

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

document.addEventListener('DOMContentLoaded', async () => {
    try {
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
        monthYearSelect.addEventListener('change', async (e) => {
            const selectedData = fechas.find(f => f.timestamp.seconds.toString() === e.target.value);
            if (selectedData) {
                await updateCharts(selectedData.data);
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
        console.error("Error al cargar datos:", error);
    }
});

// Función para actualizar las gráficas
async function updateCharts(data) {
    if (!data) {
        console.log('No hay datos para mostrar');
        return;
    }
    // Aquí va tu código existente para actualizar las gráficas
    // ...
}
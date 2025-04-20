import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Llenar el selector con las fechas disponibles
        const monthYearSelect = document.getElementById('monthYearSelect');
        const fechasUnicas = new Map();
        
        // Agregar marzo 2024 y meses futuros hasta abril 2025
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
            { month: 11, year: 2025 }, // Diciembre 2025
        ];

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

        // Agregar datos existentes de Firebase
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fecha) {
                const fecha = new Date(data.fecha.seconds * 1000);
                const fechaStr = fecha.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long' 
                });
                // Actualizar con datos reales si existen
                if (fechasUnicas.has(fechaStr)) {
                    fechasUnicas.get(fechaStr).data = data;
                }
            }
        });

        // Convertir el Map a Array y ordenar por fecha
        const fechas = Array.from(fechasUnicas.values())
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

        // Agregar opciones al select
        fechas.forEach(fecha => {
            const option = document.createElement('option');
            option.value = fecha.timestamp.seconds;
            option.textContent = fecha.str;
            monthYearSelect.appendChild(option);
        });

        // Función para actualizar los puntajes
        const updateScores = (data) => {
            if (!data) {
                // Si no hay datos para el mes seleccionado
                document.getElementById('mejor-puntaje').textContent = 'Sin datos';
                document.getElementById('peor-puntaje').textContent = 'Sin datos';
                return;
            }

            const totales = data.totales || [];
            
            const ordenCorrecto = [
                'Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 
                'Galerias', 'Guayabal', 'Movil Deportiva', 'Movil La Venta', 'Olmeca', 
                'Pista', 'USUMA', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 
                'Walmart Universidad'
            ];

            const scores = {};
            const convertToPercentage = (value) => Math.round((value / 28) * 100);

            ordenCorrecto.forEach((sucursal, index) => {
                if (totales[index] !== undefined) {
                    scores[sucursal] = convertToPercentage(parseInt(totales[index]));
                }
            });

            // Encontrar mejor y peor puntaje
            const scoresArray = Object.entries(scores);
            if (scoresArray.length > 0) {
                const mejorPuntaje = scoresArray.reduce((max, current) => 
                    current[1] > max[1] ? current : max
                );
                const peorPuntaje = scoresArray.reduce((min, current) => 
                    current[1] < min[1] ? current : min
                );

                // Actualizar el DOM con colores según el puntaje
                const mejorPuntajeElement = document.getElementById('mejor-puntaje');
                const peorPuntajeElement = document.getElementById('peor-puntaje');
                
                mejorPuntajeElement.textContent = `${mejorPuntaje[0]}: ${mejorPuntaje[1]}%`;
                peorPuntajeElement.textContent = `${peorPuntaje[0]}: ${peorPuntaje[1]}%`;
                
                mejorPuntajeElement.className = 'score-content ' + 
                    (mejorPuntaje[1] >= 95 ? 'excellent' : 
                     mejorPuntaje[1] >= 90 ? 'good' : 'needs-improvement');
                     
                peorPuntajeElement.className = 'score-content ' + 
                    (peorPuntaje[1] >= 95 ? 'excellent' : 
                     peorPuntaje[1] >= 90 ? 'good' : 'needs-improvement');
            }
        };

        // Event listener para el select
        monthYearSelect.addEventListener('change', (e) => {
            const selectedData = fechas.find(f => f.timestamp.seconds.toString() === e.target.value);
            if (selectedData) {
                updateScores(selectedData.data);
            }
        });

        // Mostrar datos iniciales
        if (fechas.length > 0) {
            const currentMonthData = getCurrentMonthData(fechas);
            if (currentMonthData) {
                monthYearSelect.value = currentMonthData.timestamp.seconds;
                updateScores(currentMonthData.data);
            } else {
                monthYearSelect.value = fechas[0].timestamp.seconds;
                updateScores(fechas[0].data);
            }
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});
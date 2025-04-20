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

// Función para actualizar los dots
function updateScoreDots(scores) {
    const allBranchItems = document.querySelectorAll('.branch-group li');
    
    allBranchItems.forEach(item => {
        const dot = item.querySelector('.score-dot');
        const branchText = item.textContent.trim();
        
        // Limpiar clases existentes
        dot.classList.remove('score-dot-excellent', 'score-dot-good', 'score-dot-needs-improvement');
           
        // Normalizar el texto removiendo todos los acentos
        let normalizedName = branchText
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        
        // Buscar el score correspondiente
        let score;
        if (normalizedName.includes('Movil')) {
            score = scores['Movil' + normalizedName.split('Movil')[1]];
        } else if (normalizedName.includes('Walmart')) {
            score = scores['Walmart' + normalizedName.split('Walmart')[1]];
        } else {
            score = scores[normalizedName];
        }
        
        if (score >= 95) {
            dot.classList.add('score-dot-excellent');
        } else if (score >= 90) {
            dot.classList.add('score-dot-good');
        } else {
            dot.classList.add('score-dot-needs-improvement');
        }
        
        // Para debug
        console.log(`Original: ${branchText}, Normalizado: ${normalizedName}, Score: ${score}%`);
    });
}

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

        // Obtener datos de Firebase y actualizar el Map
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

        // Función para procesar y mostrar datos
        const processAndDisplayData = (data) => {
            if (!data) return;
            
            const totales = data.totales || [];
            const scores = {
                'Altabrisa': 0,
                'Americas': 0,
                'Angeles': 0,
                'Centro': 0,
                'Cristal': 0,
                'Deportiva': 0,
                'Galerias': 0,
                'Guayabal': 0,
                'Movil Deportiva': 0,
                'Movil La Venta': 0,
                'Olmeca': 0,
                'Pista': 0,
                'USUMA': 0,
                'UVM': 0,
                'Walmart Carrizal': 0,
                'Walmart Deportiva': 0,
                'Walmart Universidad': 0
            };
            
            const ordenCorrecto = Object.keys(scores);
        
            const convertToPercentage = (value) => Math.round((value / 28) * 100);
        
            ordenCorrecto.forEach((sucursal, index) => {
                if (totales[index] !== undefined) {
                    scores[sucursal] = convertToPercentage(parseInt(totales[index]));
                }
            });
        
            updateScoreDots(scores);
        };

        // Event listener para el cambio de mes
        monthYearSelect.addEventListener('change', (e) => {
            const selectedData = fechas.find(f => f.timestamp.seconds.toString() === e.target.value);
            if (selectedData) {
                processAndDisplayData(selectedData.data);
            }
        });

        // Mostrar datos iniciales
        if (fechas.length > 0) {
            const currentMonthData = getCurrentMonthData(fechas);
            if (currentMonthData) {
                monthYearSelect.value = currentMonthData.timestamp.seconds;
                processAndDisplayData(currentMonthData.data);
            } else {
                monthYearSelect.value = fechas[0].timestamp.seconds;
                processAndDisplayData(fechas[0].data);
            }
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});
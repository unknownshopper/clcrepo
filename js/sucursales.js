import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Función para actualizar los dots
function updateScoreDots(scores) {
    const allBranchItems = document.querySelectorAll('.branch-group li .score-dot');
    
    allBranchItems.forEach(dot => {
        const branchName = dot.parentElement.textContent;
        const score = scores[branchName];
        
        if (score >= 95) {
            dot.classList.add('score-dot-excellent');
        } else if (score >= 90) {
            dot.classList.add('score-dot-good');
        } else {
            dot.classList.add('score-dot-needs-improvement');
        }
    });
}

// Evento principal
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            console.log('Datos cargados:', docData);
            
            // Convertir totales a porcentajes
            const totales = docData.totales || [];
            const scores = {};
            
            const ordenCorrecto = [
                'Altabrisa', 'Americas', 'Angeles', 'Centro', 'Cristal', 'Deportiva', 
                'Galerias', 'Guayabal', 'Movil Deportiva', 'Movil La Venta', 'Olmeca', 
                'Pista', 'USUMA', 'UVM', 'Walmart Carrizal', 'Walmart Deportiva', 
                'Walmart Universidad'
            ];

            // Convertir a porcentaje (28 puntos = 100%)
            const convertToPercentage = (value) => Math.round((value / 28) * 100);

            ordenCorrecto.forEach((sucursal, index) => {
                if (totales[index] !== undefined) {
                    scores[sucursal] = convertToPercentage(parseInt(totales[index]));
                }
            });

            updateScoreDots(scores);
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Función para actualizar los dots
function updateDots(scores) {
    const dots = document.querySelectorAll('.status-dot');
    dots.forEach(dot => {
        const branchName = dot.getAttribute('data-branch');
        const score = scores[branchName];
        
        if (score >= 95) {
            dot.style.backgroundColor = '#4CAF50';  // Verde
        } else if (score >= 90) {
            dot.style.backgroundColor = '#FFC107';  // Amarillo
        } else {
            dot.style.backgroundColor = '#F44336';  // Rojo
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
            
            if (docData.porcentajes) {
                updateDots(docData.porcentajes);
            }
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});
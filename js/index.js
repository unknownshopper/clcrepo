import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const evaluacionesRef = collection(db, 'evaluaciones');
        const q = query(evaluacionesRef, orderBy('fecha', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            const totales = docData.totales || [];
            
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
            const mejorPuntaje = scoresArray.reduce((max, current) => 
                current[1] > max[1] ? current : max
            );
            const peorPuntaje = scoresArray.reduce((min, current) => 
                current[1] < min[1] ? current : min
            );

            // Actualizar el DOM
            document.getElementById('mejor-puntaje').textContent = 
                `${mejorPuntaje[0]}: ${mejorPuntaje[1]}%`;
            document.getElementById('peor-puntaje').textContent = 
                `${peorPuntaje[0]}: ${peorPuntaje[1]}%`;
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
});
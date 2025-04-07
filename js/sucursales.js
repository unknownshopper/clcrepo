import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function updateBranchColors() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    try {
        const docRef = doc(db, 'evaluaciones', `${year}_${month}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const percentages = data.porcentajes;
            const branchElements = document.querySelectorAll('.branch-group li');
            
            branchElements.forEach((branchElement) => {
                const branchName = branchElement.textContent.trim();
                const index = getBranchIndex(branchName);
                if (index !== -1) {
                    const percentage = parseInt(percentages[index]);
                    
                    // Remove existing classes
                    branchElement.classList.remove('score-excellent', 'score-good', 'score-needs-improvement');
                    
                    // Add appropriate class based on percentage
                    if (percentage >= 95) {
                        branchElement.classList.add('score-excellent');
                    } else if (percentage >= 90) {
                        branchElement.classList.add('score-good');
                    } else {
                        branchElement.classList.add('score-needs-improvement');
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error loading branch scores:", error);
    }
}

function getBranchIndex(branchName) {
    const branchOrder = [
        'Altabrisa', 'Américas', 'Ángeles', 'Centro', 'Cristal', 
        'Deportiva', 'Galerías', 'Guayabal', 'Móvil Deportiva', 
        'Móvil La Venta', 'Olmeca', 'Pista', 'USUMA', 'UVM', 
        'Walmart Carrizal', 'Walmart Deportiva', 'Walmart Universidad'
    ];
    return branchOrder.indexOf(branchName);
}

document.addEventListener('DOMContentLoaded', updateBranchColors);
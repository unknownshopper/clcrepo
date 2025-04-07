import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function calculateTotals() {
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr:not(.totals)');
    const cols = table.querySelectorAll('thead th');
    
    // Calculate totals for each parameter (row)
    rows.forEach(row => {
        let rowTotal = 0;
        const cells = row.querySelectorAll('td:not(:first-child):not(:last-child)');
        cells.forEach(cell => {
            rowTotal += parseInt(cell.textContent) || 0;
        });
        row.querySelector('td:last-child').textContent = rowTotal;
    });

    // Calculate totals for each branch (column)
    const totalRow = table.querySelector('.totals');
    for(let i = 1; i < cols.length - 1; i++) {
        let colTotal = 0;
        rows.forEach(row => {
            colTotal += parseInt(row.querySelectorAll('td')[i].textContent) || 0;
        });
        totalRow.querySelectorAll('td')[i].textContent = colTotal;
    }

    // Calculate grand total
    const grandTotal = Array.from(totalRow.querySelectorAll('td:not(:first-child):not(:last-child)'))
        .reduce((sum, cell) => sum + (parseInt(cell.textContent) || 0), 0);
    totalRow.querySelector('.grand-total').textContent = grandTotal;
}

// Add event listener for input changes
async function saveValues() {
    const month = document.getElementById('monthSelect').value;
    const year = new Date().getFullYear();
    
    try {
        const docRef = doc(db, 'evaluaciones', `${year}_${month}`);
        await setDoc(docRef, {
            fecha: new Date(),
            datos: getCurrentTableData(),
            totales: Array.from(document.querySelectorAll('.totals td')).slice(1).map(td => td.textContent),
            porcentajes: Array.from(document.querySelectorAll('.percentages td')).slice(1).map(td => td.textContent)
        });
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function getCurrentTableData() {
    const table = document.querySelector('table');
    const data = {};
    table.querySelectorAll('tbody tr:not(.totals):not(.percentages)').forEach(row => {
        const paramName = row.querySelector('td:first-child').textContent;
        const rowData = {};
        row.querySelectorAll('td:not(:first-child)').forEach((cell, colIndex) => {
            rowData[colIndex] = cell.textContent;
        });
        data[paramName] = rowData;
    });
    return data;
}

function calculateScores() {
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr:not(.totals):not(.percentages)');
    const totalRow = table.querySelector('.totals');
    const percentageRow = table.querySelector('.percentages');
    const totals = new Array(17).fill(0);
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td:not(:first-child)');
        cells.forEach((cell, index) => {
            totals[index] += parseInt(cell.textContent) || 0;
        });
    });

    if (totalRow) {
        const totalCells = totalRow.querySelectorAll('td:not(:first-child)');
        totalCells.forEach((cell, index) => {
            cell.textContent = totals[index];
        });
    }

    if (percentageRow) {
        const percentageCells = percentageRow.querySelectorAll('td:not(:first-child)');
        const maxPossible = rows.length;
        percentageCells.forEach((cell, index) => {
            const percentage = (totals[index] / maxPossible) * 100;
            cell.textContent = `${Math.round(percentage)}%`;
        });
    }
}

// Add loadSavedValues function definition
async function loadSavedValues() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) {
        console.error('Month selector not found');
        return;
    }
    
    const table = document.querySelector('table');
    const month = monthSelect.value;
    const year = new Date().getFullYear();
    
    try {
        const docRef = doc(db, 'evaluaciones', `${year}_${month}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data().datos;
            table.querySelectorAll('tbody tr:not(.totals):not(.percentages)').forEach(row => {
                const paramName = row.querySelector('td:first-child').textContent;
                if (data[paramName]) {
                    Object.entries(data[paramName]).forEach(([colIndex, value]) => {
                        const cell = row.querySelectorAll('td:not(:first-child)')[colIndex];
                        if (cell) {
                            cell.textContent = value;
                            cell.style.backgroundColor = value === '1' ? '#e8f5e9' : '';
                        }
                    });
                }
            });
            calculateScores();
        } else {
            resetTable();
        }
    } catch (error) {
        console.error("Error cargando datos:", error);
        resetTable();
    }
}

// Add resetTable function definition
function resetTable() {
    const table = document.querySelector('table');
    table.querySelectorAll('td:not(:first-child)').forEach(cell => {
        if (!cell.parentElement.classList.contains('totals') && 
            !cell.parentElement.classList.contains('percentages')) {
            cell.textContent = '0';
            cell.style.backgroundColor = '';
        }
    });
    calculateScores();
}

// At the beginning of the file, add a page check
function isScoresPage() {
    return window.location.pathname.includes('scores.html');
}

// Wrap the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async () => {
    // Only run table-related code on scores.html
    if (!isScoresPage()) return;

    const table = document.querySelector('table');
    if (!table) {
        console.error('Table not found');
        return;
    }
    
    const cells = table.querySelectorAll('td:not(:first-child)');
    
    // Initialize month selector first
    const monthSelector = document.createElement('div');
    monthSelector.className = 'month-selector';
    monthSelector.innerHTML = `
        <select id="monthSelect">
            ${Array.from({length: 12}, (_, i) => {
                const currentMonth = new Date().getMonth() + 1;
                return `<option value="${i + 1}" ${currentMonth === i + 1 ? 'selected' : ''}>
                    ${new Date(0, i).toLocaleString('es', {month: 'long'})}
                </option>`;
            })}
        </select>
        <span>${new Date().getFullYear()}</span>
    `;
    table.parentElement.insertBefore(monthSelector, table);

    // Now load data and set up event listeners
    await loadSavedValues();
    
    cells.forEach(cell => {
        if (!cell.textContent || cell.textContent.trim() === '') {
            cell.textContent = '0';
        }
        
        if (!cell.parentElement.classList.contains('totals') && 
            !cell.parentElement.classList.contains('percentages')) {
            
            cell.addEventListener('click', async () => {
                cell.textContent = cell.textContent === '0' ? '1' : '0';
                cell.style.backgroundColor = cell.textContent === '1' ? '#e8f5e9' : '';
                calculateScores();
                await saveValues();
            });
        }
    });

    document.getElementById('monthSelect').addEventListener('change', loadSavedValues);
    calculateScores();
});
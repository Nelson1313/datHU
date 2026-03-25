/* MONTHS */

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/* DATE SELECTORS */

const startYear = document.getElementById("startYear");
const endYear = document.getElementById("endYear");
const startMonth = document.getElementById("startMonth");
const endMonth = document.getElementById("endMonth");

const regYear = document.getElementById("regYear");
const calcYear = document.getElementById("calcYear");
const regMonth = document.getElementById("regMonth");
const calcMonth = document.getElementById("calcMonth");

/* YEAR OPTIONS */

for (let y = 2040; y >= 2000; y--) {

    startYear.innerHTML += `<option value="${y}">${y}</option>`;
    endYear.innerHTML += `<option value="${y}">${y}</option>`;
    regYear.innerHTML += `<option value="${y}">${y}</option>`;
    calcYear.innerHTML += `<option value="${y}">${y}</option>`;

}

/* MONTH OPTIONS */

months.forEach((m, i) => {

    startMonth.innerHTML += `<option value="${i + 1}">${m}</option>`;
    endMonth.innerHTML += `<option value="${i + 1}">${m}</option>`;
    regMonth.innerHTML += `<option value="${i + 1}">${m}</option>`;
    calcMonth.innerHTML += `<option value="${i + 1}">${m}</option>`;

});

/* TODAY DEFAULT */

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

/* Depreciation */

endYear.value = currentYear;
endMonth.value = currentMonth;

/* Registration procedure */

calcYear.value = currentYear;
calcMonth.value = currentMonth;

/* First registration */

regYear.value = currentYear - 5;
regMonth.value = currentMonth;

window.addEventListener("load", () => {

    initDepreciationChart();
    initOfficeChart();
    loadExcelFromServer();
    loadOfficeChart();
    loadChangeTable();
    loadStatsTable();

    updateArrows();

});

document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

const changeTable = document.getElementById("changeTable");

changeTable.addEventListener("mouseover", function (e) {

    const cell = e.target.closest("td, th");
    if (!cell) return;

    const colIndex = cell.cellIndex;

    /* Month oszlop kihagyása */

    if (colIndex === 0) return;

    const rows = changeTable.rows;

    for (let r of rows) {

        if (r.cells[colIndex]) {
            r.cells[colIndex].classList.add("col-hover");
        }

    }

});

changeTable.addEventListener("mouseout", function (e) {

    const cell = e.target.closest("td, th");
    if (!cell) return;

    const colIndex = cell.cellIndex;

    if (colIndex === 0) return;

    const rows = changeTable.rows;

    for (let r of rows) {

        if (r.cells[colIndex]) {
            r.cells[colIndex].classList.remove("col-hover");
        }

    }

});
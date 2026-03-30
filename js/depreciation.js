let chart;
let excelLookup = {};

function initDepreciationChart() {

    const ctx = document.getElementById("chart");

    if (!ctx) return;

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: "#0A3D91",
                backgroundColor: "rgba(10,61,145,0.15)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: 0, max: 100 } }
        }
    });

}

function loadExcelFromServer() {

    fetch("data/km_table.xlsx")
        .then(res => res.arrayBuffer())
        .then(data => {

            const workbook = XLSX.read(data, { type: "array" });

            workbook.SheetNames.forEach(sheetName => {

                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                excelLookup[sheetName] = [];

                for (let i = 4; i < json.length; i++) {

                    const row = json[i];
                    const km = row[1]; // B oszlop

                    if (!km) continue;

                    let values = {};

                    for (let col = 1; col <= 9; col++) {
                        values[col] = row[col + 1]; // C–K
                    }

                    excelLookup[sheetName].push({
                        km: km,
                        values: values
                    });

                }

            });

            console.log("Excel betöltve háttérben:", excelLookup);

        })
        .catch(err => {
            console.error("Excel betöltési hiba:", err);
        });
}

function getExcelValue(sheet, diff, column) {

    const rows = excelLookup[sheet];

    if (!rows || rows.length === 0) return null;

    let selected = rows[0];

    for (let row of rows) {
        if (row.km <= diff) {
            selected = row;
        } else {
            break;
        }
    }

    return selected.values[column];
}

function calculate() {

    const sy = parseInt(startYear.value);
    const sm = parseInt(startMonth.value) - 1;

    const ey = parseInt(endYear.value);
    const em = parseInt(endMonth.value) - 1;

    const startTotal = sy * 12 + sm;
    const endTotal = ey * 12 + em;

    if (Object.keys(excelLookup).length === 0) {
        alert("Excel data is still loading...");
        return;
    }

    if (endTotal < startTotal) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    const totalMonths = endTotal - startTotal;

    const rate1 = parseFloat(document.getElementById("rate1").value) / 100;
    const years1 = parseInt(document.getElementById("years1").value);
    const rate2 = parseFloat(document.getElementById("rate2").value) / 100;

    const monthsRate1 = years1 * 12;

    // ===== Excel KM korrekció =====

    const theoreticalKm = parseInt(document.getElementById("theoreticalKm").value);
    const customerKm = parseInt(document.getElementById("customerKm").value);
    const sheet = document.getElementById("sheetSelect").value;
    const column = parseInt(document.getElementById("columnSelect").value);

    let correctionPercent = 0;

    if (!isNaN(theoreticalKm) && !isNaN(customerKm)) {

        const diff = Math.abs(customerKm - theoreticalKm);

        const excelValue = getExcelValue(sheet, diff, column);

        if (excelValue !== null) {
            correctionPercent = excelValue;
        }

    }

    let values = [];
    let labels = [];

    let current = 1;

    values.push(100);
    labels.push(0);

    for (let i = 1; i <= totalMonths; i++) {

        if (i <= monthsRate1) {
            current *= (1 - rate1);
        } else {
            current *= (1 - rate2);
        }

        values.push((current * 100).toFixed(2));
        labels.push(i);
    }

    if (correctionPercent !== 0) {
        current *= (1 + correctionPercent / 100);

        values[values.length - 1] = (current * 100).toFixed(2);
    }

    document.getElementById("output").innerHTML =
        `Remaining Value: ${(current * 100).toFixed(2)}%`;

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();

}

function openKmModal() {
    document.getElementById("kmModal").classList.remove("hidden");
}

function closeKmModal() {
    document.getElementById("kmModal").classList.add("hidden");
}

function calculateKmCorrection() {

    if (Object.keys(excelLookup).length === 0) {
        alert("Excel still loading...");
        return;
    }

    const sheet = document.getElementById("kmSheet").value;
    const column = parseInt(document.getElementById("kmColumn").value);

    const theo = parseInt(document.getElementById("kmTheo").value);
    const cust = parseInt(document.getElementById("kmCust").value);

    if (isNaN(theo) || isNaN(cust)) {
        alert("Please enter KM values");
        return;
    }

    const diff = Math.abs(cust - theo);

    const value = getExcelValue(sheet, diff, column);

    document.getElementById("kmResult").innerHTML =
        `Difference: ${diff} km<br>Correction: ${value}%`;
}
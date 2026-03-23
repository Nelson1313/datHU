let officeChart;

function initOfficeChart() {

    const ctx = document.getElementById("officeChart");

    if (!ctx) return;

    officeChart = new Chart(ctx, {
        type: "line",

        data: {
            labels: [],
            datasets: [{
                label: "",
                data: [],
                borderColor: "#FFD200",
                backgroundColor: "#FFD200",
                pointRadius: 3,
                pointHoverRadius: 10,
                pointHoverBackgroundColor: "#FFD200",
                pointHoverBorderColor: "#000",
                tension: 0.25,
                fill: false
            }]
        },

        options: {

            onHover: (event, elements, chart) => {

                const xScale = chart.scales.x;
                if (!xScale) return;

                // csak X tengelynél működjön
                if (event.y < xScale.bottom) return;

                const index = xScale.getValueForPixel(event.x);
                if (index === undefined) return;

                const i = Math.round(index);

                if (window.activeIndex !== i) {

                    window.activeIndex = i;

                    chart.setActiveElements([{
                        datasetIndex: 0,
                        index: i
                    }]);

                    chart.tooltip.setActiveElements([{
                        datasetIndex: 0,
                        index: i
                    }], {
                        x: xScale.getPixelForValue(i),
                        y: chart.scales.y.getPixelForValue(
                            chart.data.datasets[0].data[i]
                        )
                    });

                    chart.update();
                }
            },

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "nearest",
                intersect: false
            },

            plugins: {
                legend: { display: false },

                tooltip: {
                    enabled: true,
                    backgroundColor: "#000",
                    titleColor: "#FFD200",
                    bodyColor: "#fff",
                    borderColor: "#FFD200",
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,

                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            return "Érték: " + context.raw;
                        }
                    }
                },

                crosshair: {
                    line: {
                        color: '#FFD200',
                        width: 1
                    }
                }
            },

            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 10
                },
                line: {
                    borderWidth: 2
                }
            },

            scales: {
                x: {
                    ticks: {
                        callback: function (value, index) {
                            if (index === window.activeIndex) {
                                return "👉 " + this.getLabelForValue(value);
                            }
                            return this.getLabelForValue(value);
                        },
                        autoSkip: false,
                        maxRotation: 60,
                        minRotation: 60,
                        font: { size: 10 }
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }

    });

}

function excelDateToJSDate(serial) {

    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(serial);

    return new Date(excelEpoch.getTime() + days * 86400000);

}

async function loadOfficeChart() {

    const office = document.getElementById("officeSelect").value;

    const response = await fetch("./data/adattabla.xlsx");
    const buffer = await response.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });

    const sheet = workbook.Sheets["Munka1"];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let rowIndex;

    if (office === "4control") rowIndex = 2;
    if (office === "dekra") rowIndex = 4;
    if (office === "expert") rowIndex = 6;

    const header = rows[0];
    const data = rows[rowIndex];

    if (!data) {
        console.error("Nincs adat az irodához");
        return;
    }

    const rawLabels = header.slice(2);
    const rawValues = data.slice(2);

    const labels = [];
    const values = [];

    for (let i = 0; i < rawLabels.length; i++) {

        const value = rawValues[i];
        let label = rawLabels[i];

        if (value === null) break;
        if (isNaN(value)) continue;

        if (typeof label === "number") {

            const d = excelDateToJSDate(label);

            label =
                d.getFullYear() + ". " +
                d.toLocaleString("hu-HU", { month: "long" });

        }

        labels.push(label);
        values.push(Number(value));

    }

    const MAX_POINTS = 24;

    const finalLabels = labels.slice(-MAX_POINTS);
    const finalValues = values.slice(-MAX_POINTS);

    officeChart.data.labels = finalLabels;
    officeChart.data.datasets[0].data = finalValues;

    officeChart.update();

}

async function loadChangeTable() {

    const response = await fetch("./data/adattabla.xlsx");
    const buffer = await response.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets["Munka1"];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const tbody = document.querySelector("#changeTable tbody");
    tbody.innerHTML = "";

    /* partner sorok */

    const partners = {
        "4Control": 2,
        "DEKRA": 4,
        "Expert": 6,
        "Pilkington": 8,
        "Porsche": 10,
        "Toyota": 12
    };

    let currentYear = null;

    /* AJ → BX */

    for (let col = 35; col <= 74; col++) {

        const year = rows[0][col];
        const month = rows[1][col];

        if (year) currentYear = year;

        if (!month) continue;

        const tr = document.createElement("tr");

        let html = `<td>${currentYear}.<br>${month}</td>`;

        for (const key in partners) {

            const rowIndex = partners[key];
            const value = rows[rowIndex][col];

            if (value === null || value === "") {
                html += `<td></td>`;
                continue;
            }

            const percent = (Number(value) * 100).toFixed(1);

            let cls = "";

            if (value > 1) cls = "positive";
            if (value < 1) cls = "negative";

            html += `<td class="${cls}">${percent}%</td>`;

        }

        tr.innerHTML = html;
        tbody.appendChild(tr);

    }

}

async function loadStatsTable() {

    const response = await fetch("./data/adattabla.xlsx");
    const buffer = await response.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets["Munka1"];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const table = document.getElementById("statsTable");
    table.innerHTML = "";

    /* ---------- HEADER ---------- */

    const thead = document.createElement("thead");
    const tr = document.createElement("tr");

    const thPartner = document.createElement("th");
    thPartner.textContent = "Partner";
    tr.appendChild(thPartner);

    for (let c = 2; c <= 33; c++) {

        let header = rows[0][c];

        if (header === null) continue;

        /* Excel dátum konverzió */

        if (typeof header === "number") {

            const d = excelDateToJSDate(header);

            header =
                d.getFullYear() + ". " +
                d.toLocaleString("hu-HU", { month: "long" });

        }

        const th = document.createElement("th");
        th.textContent = header;

        tr.appendChild(th);

    }

    thead.appendChild(tr);
    table.appendChild(thead);

    /* ---------- BODY ---------- */

    const partners = [2, 4, 6, 8, 10, 12];

    const tbody = document.createElement("tbody");

    for (const r of partners) {

        const tr = document.createElement("tr");

        const tdPartner = document.createElement("td");
        tdPartner.textContent = rows[r][0];
        tr.appendChild(tdPartner);

        for (let c = 2; c <= 33; c++) {

            const val = rows[r][c];

            if (val === null) continue;

            const td = document.createElement("td");

            /* első hónap */

            if (c === 2) {
                td.textContent = val;
            }

            else {

                const prev = rows[r][c - 1];

                if (prev !== null) {

                    const diff = val - prev;

                    /* növekedés */

                    if (diff > 0) {
                        td.classList.add("positive");
                        td.innerHTML = `${val}<br><span>(+${diff})</span>`;
                    }

                    else if (diff < 0) {
                        td.classList.add("negative");
                        td.innerHTML = `${val}<br><span>(${diff})</span>`;
                    }

                    else {
                        td.textContent = val;
                    }

                }

            }

            tr.appendChild(td);

        }

        tbody.appendChild(tr);

    }

    table.appendChild(tbody);

}
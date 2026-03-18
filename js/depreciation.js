let chart;

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

function calculate() {

    const sy = parseInt(startYear.value);
    const sm = parseInt(startMonth.value) - 1;

    const ey = parseInt(endYear.value);
    const em = parseInt(endMonth.value) - 1;

    const startTotal = sy * 12 + sm;
    const endTotal = ey * 12 + em;

    if (endTotal < startTotal) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    const totalMonths = endTotal - startTotal;

    const rate1 = parseFloat(document.getElementById("rate1").value) / 100;
    const years1 = parseInt(document.getElementById("years1").value);
    const rate2 = parseFloat(document.getElementById("rate2").value) / 100;

    const monthsRate1 = years1 * 12;

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

    document.getElementById("output").innerHTML =
        `Remaining Value: ${values[values.length - 1]}%`;

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();

}
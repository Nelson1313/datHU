const baseTaxTable = [

    [47000, 70500, 282000, 564000, 1128000],
    [70500, 105750, 423000, 846000, 1692000],
    [94000, 141000, 564000, 1128000, 2256000],
    [141000, 211500, 846000, 1692000, 3384000],
    [188000, 282000, 1128000, 2256000, 4512000],
    [282000, 423000, 1692000, 3384000, 6768000],
    [423000, 634500, 2538000, 5076000, 10152000],
    [0, 0, 0, 0, 0]

];

function getAgeMultiplier(months) {

    if (months === 0) return 1;
    if (months <= 2) return 0.97;
    if (months <= 4) return 0.92;
    if (months <= 6) return 0.87;
    if (months <= 12) return 0.82;
    if (months <= 18) return 0.77;
    if (months <= 24) return 0.72;
    if (months <= 30) return 0.67;
    if (months <= 36) return 0.62;
    if (months <= 48) return 0.55;
    if (months <= 60) return 0.47;
    if (months <= 72) return 0.41;
    if (months <= 84) return 0.35;
    if (months <= 96) return 0.30;
    if (months <= 108) return 0.26;
    if (months <= 120) return 0.22;

    return 0.10;

}

function toggleNewCar(isNew) {

    regYear.disabled = isNew;
    regMonth.disabled = isNew;
    calcYear.disabled = isNew;
    calcMonth.disabled = isNew;

    if (isNew) {
        regYear.value = "";
        regMonth.value = "";
        calcYear.value = "";
        calcMonth.value = "";
    }

}

function calculateTax() {

    let powerIndex = parseInt(document.getElementById("power").value);
    let envIndex = parseInt(document.getElementById("envClass").value);

    if (powerIndex === 7) {

        document.getElementById("taxResult").innerHTML = `
Base Tax: 0 Ft<br>
Reduction: 0 Ft<br>
Payable Tax: 0 Ft
`;

        return;

    }

    let baseTax = baseTaxTable[powerIndex]?.[envIndex] ?? 0;

    const newCarRadio = document.querySelector('input[name="newCar"]:checked');
    const newCar = newCarRadio ? newCarRadio.value === "yes" : false;

    let payable = baseTax;

    if (!newCar) {

        let regY = parseInt(regYear.value || 0);
        let regM = parseInt(regMonth.value || 0);

        let calcY = parseInt(calcYear.value || 0);
        let calcM = parseInt(calcMonth.value || 0);

        let months = (calcY * 12 + calcM) - (regY * 12 + regM);

        if (months < 0) {
            alert("Registration date cannot be after calculation date.");
            return;
        }

        let multiplier = getAgeMultiplier(months);

        payable = Math.round(baseTax * multiplier);

    }

    let reduction = newCar ? 0 : baseTax - payable;

    document.getElementById("taxResult").innerHTML = `

Base Tax: ${baseTax.toLocaleString()} Ft<br>
Reduction: ${reduction.toLocaleString()} Ft<br>
Payable Tax: ${payable.toLocaleString()} Ft

`;

}
let marketRows = [];

let fuelIndex = null;
let yearIndex = null;
let guideIndex = null;
let datIndex = null;
let saleIndex = null;

let engineIndex = null;
let equipmentIndex = null;

/* -------- PARSE NUMBER -------- */

function parseNumber(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return val;
    if (typeof val !== "string") return null;

    val = val.trim();
    if (!val) return null;

    val = val.replace(/\s+/g, "");
    val = val.replace(/\u00A0/g, "");
    val = val.replace(/\u202F/g, "");

    if (val.includes(",")) {
        val = val.replace(/\./g, "");
        val = val.replace(/,/g, ".");
    }

    const num = Number(val);
    return isNaN(num) ? null : num;
}

/* -------- MAIN -------- */

async function handleFile(file) {

    if (!file) return;

    const dropText = document.getElementById("dropText");
    dropText.textContent = `✔ ${file.name}`;

    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const header = rows[0];

    function findIndexFlexible(header, keywords) {
        return header.findIndex(h => {
            if (!h) return false;
            const t = h.toString().toLowerCase();
            return keywords.some(k => t.includes(k));
        });
    }

    fuelIndex = findIndexFlexible(header, ["üzem", "fuel"]);
    yearIndex = findIndexFlexible(header, ["forgal", "registration"]);
    guideIndex = findIndexFlexible(header, ["irány", "guide"]);

    datIndex = header.findIndex(h => {
        if (!h) return false;
        const t = h.toString().toLowerCase();
        return t.includes("dat") && t.includes("ár") && !t.includes("kód");
    });

    saleIndex = findIndexFlexible(header, ["elad", "sale"]);
    engineIndex = findIndexFlexible(header, ["motor", "engine"]);
    equipmentIndex = findIndexFlexible(header, ["felszer", "equipment", "trim"]);

    marketRows = rows.slice(1);

    localStorage.setItem("marketFull", JSON.stringify({
        header,
        rows: marketRows
    }));

    generateFilters();
    calculateFilteredStats();

    document.querySelectorAll('#view-market input:not(#marketFile)')
        .forEach(i => i.disabled = false);
}

/* -------- DATE -------- */

function excelDateToYear(val) {
    if (!val) return null;

    if (typeof val === "number") {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + val * 86400000);
        return date.getFullYear();
    }

    const num = Number(val);
    if (!isNaN(num) && num > 1900 && num < 2100) {
        return num;
    }

    return null;
}

/* -------- FILTER CORE -------- */

function getSelectedValues(containerId, className) {
    const container = document.getElementById(containerId);
    return [...container.querySelectorAll(`.${className}:checked`)]
        .map(e => e.value.trim());
}

function getFilteredRows(ignoreFilter = null) {

    const selectedFuel = getSelectedValues("fuelFilters", "fuelFilter");
    const selectedYear = getSelectedValues("yearFilters", "yearFilter");
    const selectedEngine = getSelectedValues("engineFilters", "engineFilter");
    const selectedEquipment = getSelectedValues("equipmentFilters", "equipmentFilter");

    if (
        ignoreFilter === null && (
            selectedFuel.length === 0 ||
            selectedYear.length === 0 ||
            selectedEngine.length === 0 ||
            selectedEquipment.length === 0
        )
    ) {
        return marketRows;
    }

    return marketRows.filter(r => {

        const fuelValue = r[fuelIndex] != null ? String(r[fuelIndex]).trim() : "";
        const rowYear = excelDateToYear(r[yearIndex]);
        const engineValue = r[engineIndex] != null ? String(r[engineIndex]).trim() : "";
        const equipmentValue = r[equipmentIndex] != null ? String(r[equipmentIndex]).trim() : "";

        if (ignoreFilter !== "fuel" && !selectedFuel.includes(fuelValue)) return false;
        if (ignoreFilter !== "year" && (!rowYear || !selectedYear.includes(String(rowYear)))) return false;
        if (ignoreFilter !== "engine" && !selectedEngine.includes(engineValue)) return false;
        if (ignoreFilter !== "equipment" && !selectedEquipment.includes(equipmentValue)) return false;

        return true;
    });
}

/* -------- FILTER UI -------- */

function generateFilters() {

    createFilter("fuelFilters", fuelIndex, "fuelFilter");
    createFilter("yearFilters", yearIndex, "yearFilter", true);
    createFilter("engineFilters", engineIndex, "engineFilter");
    createFilter("equipmentFilters", equipmentIndex, "equipmentFilter");

    ["fuelFilters", "yearFilters", "engineFilters", "equipmentFilters"]
        .forEach(id => {
            document.getElementById(id)
                .addEventListener("change", calculateFilteredStats);
        });
}

function createFilter(containerId, index, className, isYear = false) {

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const values = new Set();

    marketRows.forEach(r => {
        let val = r[index];

        if (isYear) val = excelDateToYear(val);
        if (val) values.add(val);
    });

    [...values].sort().forEach(v => {

        const count = marketRows.filter(r => {
            let val = r[index];
            if (isYear) val = excelDateToYear(val);
            return val === v;
        }).length;

        const displayValue =
            className === "engineFilter" ? `${v} cm³` : v;

        container.innerHTML += `
<label class="filter-item">
  <input type="checkbox" value="${String(v).trim()}" class="${className}" checked>
  <span class="label-text">${displayValue}</span>
  <span class="count">${count}</span>
</label>
`;
    });
}

/* -------- COUNTS -------- */

function updateFilterCounts() {

    updateCounts("fuelFilters", "fuelFilter", fuelIndex);
    updateCounts("yearFilters", "yearFilter", yearIndex, true);
    updateCounts("engineFilters", "engineFilter", engineIndex);
    updateCounts("equipmentFilters", "equipmentFilter", equipmentIndex);
}

function updateCounts(containerId, className, index, isYear = false) {

    let filterKey;

    if (containerId === "fuelFilters") filterKey = "fuel";
    if (containerId === "yearFilters") filterKey = "year";
    if (containerId === "engineFilters") filterKey = "engine";
    if (containerId === "equipmentFilters") filterKey = "equipment";

    const rows = getFilteredRows(filterKey);
    const counts = {};

    rows.forEach(r => {
        let val = r[index];
        if (isYear) val = excelDateToYear(val);
        if (!val) return;

        val = String(val).trim();
        counts[val] = (counts[val] || 0) + 1;
    });

    document.getElementById(containerId)
        .querySelectorAll("label")
        .forEach(label => {

            const input = label.querySelector("input");
            const text = label.querySelector(".label-text");
            const val = input.value;

            const count = counts[val] || 0;
            input.disabled = false;

            let displayValue = val;

            if (className === "engineFilter") {
                displayValue = `${Number(val).toLocaleString("hu-HU")} cm³`;
            }

            text.textContent = `${displayValue} (${count})`;

            if (count === 0) {
                label.style.opacity = 0.4;
                input.checked = false;
            } else {
                label.style.opacity = 1;
            }
        });
    label.classList.toggle(
        "active",
        input.checked
    );

}

function selectAll(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} input`);

    inputs.forEach(i => i.checked = true);

    calculateFilteredStats();
}

function clearAll(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} input`);

    inputs.forEach(i => i.checked = false);

    calculateFilteredStats();
}

/* -------- CALC -------- */

function calculateFilteredStats() {

    let filteredRows = getFilteredRows();

    if (filteredRows.length === 0) {
        filteredRows = marketRows;
    }

    if (filteredRows.length === 0) {
        document.getElementById("marketResult").innerHTML = `<b>No data</b>`;
        return;
    }

    const guide = filteredRows.map(r => parseNumber(r[guideIndex])).filter(n => n);
    const dat = filteredRows.map(r => parseNumber(r[datIndex])).filter(n => n);
    const sale = filteredRows.map(r => parseNumber(r[saleIndex])).filter(n => n);

    function stats(arr) {
        if (!arr.length) return { avg: 0, min: 0, max: 0 };

        const sum = arr.reduce((a, b) => a + b, 0);

        return {
            avg: sum / arr.length,
            min: Math.min(...arr),
            max: Math.max(...arr)
        };
    }

    const sGuide = stats(guide);
    const sDat = stats(dat);
    const sSale = stats(sale);

    document.getElementById("marketResult").innerHTML = `
<div class="stat-box">
    <h3>Base Price</h3>
    <p>Average: <strong>${Math.round(sGuide.avg).toLocaleString("hu-HU")} Ft</strong></p>
    <p>Min: ${sGuide.min.toLocaleString("hu-HU")} Ft</p>
    <p>Max: ${sGuide.max.toLocaleString("hu-HU")} Ft</p>
</div>

<div class="stat-box">
    <h3>DAT Price</h3>
    <p>Average: <strong>${Math.round(sDat.avg).toLocaleString("hu-HU")} Ft</strong></p>
    <p>Min: ${sDat.min.toLocaleString("hu-HU")} Ft</p>
    <p>Max: ${sDat.max.toLocaleString("hu-HU")} Ft</p>
</div>

<div class="stat-box">
    <h3>Sale Price</h3>
    <p>Average: <strong>${Math.round(sSale.avg).toLocaleString("hu-HU")} Ft</strong></p>
    <p>Min: ${sSale.min.toLocaleString("hu-HU")} Ft</p>
    <p>Max: ${sSale.max.toLocaleString("hu-HU")} Ft</p>
</div>
`;

    setTimeout(updateFilterCounts, 0);
}

function clearMarketData() {

    localStorage.removeItem("marketFull");

    marketRows = [];

    document.getElementById("marketResult").innerHTML =
        "Upload a file to calculate statistics.";

    document.getElementById("fuelFilters").innerHTML = "";
    document.getElementById("yearFilters").innerHTML = "";
    document.getElementById("engineFilters").innerHTML = "";
    document.getElementById("equipmentFilters").innerHTML = "";

    const dropText = document.getElementById("dropText");
    if (dropText) {
        dropText.textContent = "Drag & Drop file here or click to upload";
    }

    document.querySelectorAll('#view-market input:not(#marketFile)')
        .forEach(i => i.disabled = true);
}

/* -------- INIT -------- */

document.addEventListener("DOMContentLoaded", () => {

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("marketFile");

    if (!dropZone || !fileInput) return;

    window.addEventListener("dragover", e => e.preventDefault());
    window.addEventListener("drop", e => e.preventDefault());

    /* CLICK */
    dropZone.addEventListener("click", () => {
        fileInput.value = "";
        fileInput.click();
    });

    /* FILE SELECT */
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        handleFile(file);
    });

    /* DRAG OVER */
    dropZone.addEventListener("dragover", e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("dragover");
    });

    /* DRAG LEAVE */
    dropZone.addEventListener("dragleave", e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("dragover");
    });

    /* DROP */
    dropZone.addEventListener("drop", e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    const saved = localStorage.getItem("marketFull");

    if (saved) {

        const data = JSON.parse(saved);
        const header = data.header;
        marketRows = data.rows;

        function findIndexFlexible(header, keywords) {
            return header.findIndex(h => {
                if (!h) return false;
                const t = h.toString().toLowerCase();
                return keywords.some(k => t.includes(k));
            });
        }

        fuelIndex = findIndexFlexible(header, ["üzem", "fuel"]);
        yearIndex = findIndexFlexible(header, ["forgal", "registration"]);
        guideIndex = findIndexFlexible(header, ["irány", "guide"]);

        datIndex = header.findIndex(h => {
            if (!h) return false;
            const t = h.toString().toLowerCase();
            return t.includes("dat") && t.includes("ár") && !t.includes("kód");
        });

        saleIndex = findIndexFlexible(header, ["elad", "sale"]);
        engineIndex = findIndexFlexible(header, ["motor", "engine"]);
        equipmentIndex = findIndexFlexible(header, ["felszer", "equipment", "trim"]);

        generateFilters();
        calculateFilteredStats();

        const dropText = document.getElementById("dropText");
        if (dropText) {
            dropText.textContent = "✔ Loaded from previous session";
        }
    }

});
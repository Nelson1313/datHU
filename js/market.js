let marketRows = [];
let fuelIndex = null;
let yearIndex = null;
let guideIndex = null;
let datIndex = null;
let saleIndex = null;

/* -------- PARSE NUMBER -------- */

function parseNumber(val) {

    if (val === null || val === undefined) return null;

    if (typeof val === "number") return val;

    if (typeof val !== "string") return null;

    val = val.trim();

    if (!val) return null;

    // 🔥 minden whitespace törlés (nem csak sima space!)
    val = val.replace(/\s+/g, "");

    // unicode space-ek törlése (EZ A KULCS)
    val = val.replace(/\u00A0/g, ""); // nbsp
    val = val.replace(/\u202F/g, ""); // narrow no-break space

    // EU formátum kezelés
    if (val.includes(",")) {
        val = val.replace(/\./g, "");
        val = val.replace(/,/g, ".");
    }

    const num = Number(val);

    return isNaN(num) ? null : num;
}

/* -------- MAIN -------- */

async function analyzeMarket() {

    const fileInput = document.getElementById("marketFile");

    if (!fileInput.files.length) {
        alert("Please upload an XLSX file.");
        return;
    }

    const file = fileInput.files[0];
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const header = rows[0];

    /* -------- INDEXEK -------- */

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

    /* -------- DATA -------- */

    marketRows = rows.slice(1);

    /* -------- FILTER UI -------- */

    generateFilters();

    /* -------- FIRST CALC -------- */

    calculateFilteredStats();

}

function excelDateToYear(val) {

    if (!val) return null;

    /* ha szám → Excel dátum */

    if (typeof val === "number") {

        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + val * 86400000);

        return date.getFullYear();
    }

    /* ha string (pl már év) */

    const num = Number(val);
    if (!isNaN(num) && num > 1900 && num < 2100) {
        return num;
    }

    return null;

}

function getFilteredRows(ignoreFilter = null) {

    const fuelContainer = document.getElementById("fuelFilters");
    const yearContainer = document.getElementById("yearFilters");

    const selectedFuel = [...fuelContainer.querySelectorAll(".fuelFilter:checked")]
        .map(e => e.value.trim());

    const selectedYear = [...yearContainer.querySelectorAll(".yearFilter:checked")]
        .map(e => e.value.trim());

    return marketRows.filter(r => {

        const fuelValue = r[fuelIndex] != null ? String(r[fuelIndex]).trim() : "";
        const rowYear = excelDateToYear(r[yearIndex]);

        if (ignoreFilter !== "fuel") {
            if (!selectedFuel.includes(fuelValue)) return false;
        }

        if (ignoreFilter !== "year") {
            if (!rowYear || !selectedYear.includes(String(rowYear))) return false;
        }

        return true;
    });
}

function updateFilterCounts() {

    const fuelDiv = document.getElementById("fuelFilters");
    const yearDiv = document.getElementById("yearFilters");

    const fuelRows = getFilteredRows("fuel");

    const fuelCounts = {};
    fuelRows.forEach(r => {
        const f = String(r[fuelIndex]).trim();
        if (!f) return;
        fuelCounts[f] = (fuelCounts[f] || 0) + 1;
    });

    fuelDiv.querySelectorAll("label").forEach(label => {
        const input = label.querySelector("input");
        const textSpan = label.querySelector(".label-text");
        const val = input.value;

        const count = fuelCounts[val] || 0;

        if (count === 0) {
            input.checked = false;
            input.disabled = true;
        } else {
            input.disabled = false;
        }

        textSpan.textContent = `${val} (${count})`;
    });

    const yearRows = getFilteredRows("year");

    const yearCounts = {};
    yearRows.forEach(r => {
        const y = excelDateToYear(r[yearIndex]);
        if (!y) return;
        yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    yearDiv.querySelectorAll("label").forEach(label => {
        const input = label.querySelector("input");
        const textSpan = label.querySelector(".label-text");
        const val = input.value;

        const count = yearCounts[val] || 0;

        if (count === 0) {
            input.checked = false;
            input.disabled = true;
        } else {
            input.disabled = false;
        }

        textSpan.textContent = `${val} (${count})`;
    });
}

/* -------- FILTER UI -------- */

function generateFilters() {

    const fuelDiv = document.getElementById("fuelFilters");
    const yearDiv = document.getElementById("yearFilters");

    fuelDiv.innerHTML += `
<label>
<input type="checkbox" ...>
<span class="label-text">${f} (${count})</span>
</label><br>
`;
    <span class="label-text">${y} (${count})</span>

    const fuelSet = new Set();
    const yearSet = new Set();

    marketRows.forEach(r => {

        if (r[fuelIndex]) fuelSet.add(r[fuelIndex]);

        if (r[yearIndex]) {
            const year = excelDateToYear(r[yearIndex]);
            if (year) yearSet.add(year);
        }

    });

    /* FUEL */

    [...fuelSet].sort().forEach(f => {

        const count = marketRows.filter(r => r[fuelIndex] === f).length;

        fuelDiv.innerHTML += `
<label>
<input type="checkbox" value="${String(f).trim()}" class="fuelFilter" checked>
<span class="label-text">${f} (${count})</span>
</label><br>
`;
    });

    /* YEAR */

    [...yearSet].sort().forEach(y => {

        const count = marketRows.filter(r => excelDateToYear(r[yearIndex]) === y).length;

        yearDiv.innerHTML += `
<label>
<input type="checkbox" value="${String(y).trim()}" class="yearFilter" checked>
<span class="label-text">${y} (${count})</span>
</label><br>
`;
    });

    /* EVENT */

    document.getElementById("fuelFilters").addEventListener("change", (e) => {
        calculateFilteredStats();
    });
    document.getElementById("yearFilters").addEventListener("change", (e) => {
        calculateFilteredStats();
    });

}

/* -------- FILTERED CALC -------- */

function calculateFilteredStats() {
    const fuelContainer = document.getElementById("fuelFilters");
    const yearContainer = document.getElementById("yearFilters");

    const selectedFuel = [...fuelContainer.querySelectorAll(".fuelFilter:checked")]
        .map(e => e.value.trim());

    const selectedYear = [...yearContainer.querySelectorAll(".yearFilter:checked")]
        .map(e => e.value.trim());

    if (selectedFuel.length === 0 || selectedYear.length === 0) {
        document.getElementById("marketResult").innerHTML = `
<b>No data</b><br>
Please select at least one fuel type and year.
`;
        return;
    }

    const filteredRows = marketRows.filter(r => {
        const fuelValue = r[fuelIndex] != null ? String(r[fuelIndex]).trim() : "";
        const rowYear = excelDateToYear(r[yearIndex]);

        return selectedFuel.includes(fuelValue) &&
            rowYear !== null &&
            selectedYear.includes(String(rowYear));
    });

    const guide = filteredRows
        .map(r => parseNumber(r[guideIndex]))
        .filter(v => typeof v === "number" && !isNaN(v));

    const dat = filteredRows
        .map(r => parseNumber(r[datIndex]))
        .filter(v => typeof v === "number" && !isNaN(v));

    const sale = filteredRows
        .map(r => parseNumber(r[saleIndex]))
        .filter(v => typeof v === "number" && !isNaN(v));

    function stats(arr) {
        if (arr.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

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
<b>Base Price</b><br>
Average: ${sGuide.avg.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft<br>
Min: ${sGuide.min.toLocaleString("hu-HU")} Ft<br>
Max: ${sGuide.max.toLocaleString("hu-HU")} Ft<br><br>

<b>DAT Price</b><br>
Average: ${sDat.avg.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft<br>
Min: ${sDat.min.toLocaleString("hu-HU")} Ft<br>
Max: ${sDat.max.toLocaleString("hu-HU")} Ft<br><br>

<b>Sale Price</b><br>
Average: ${sSale.avg.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft<br>
Min: ${sSale.min.toLocaleString("hu-HU")} Ft<br>
Max: ${sSale.max.toLocaleString("hu-HU")} Ft
`;

    setTimeout(() => {
        updateFilterCounts();
    }, 0);
}
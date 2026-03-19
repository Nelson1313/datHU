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

    if (typeof val === "string") {

        val = val.trim();

        if (val === "" || val === "-" || val === "–" || val === "—") return null;

        // szóköz törlés
        val = val.replace(/\s/g, "");

        // vessző → pont (EU formátum)
        val = val.replace(",", ".");

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

    setTimeout(() => {
        calculateFilteredStats();
    }, 0);

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

/* -------- FILTER UI -------- */

function generateFilters() {

    const fuelDiv = document.getElementById("fuelFilters");
    const yearDiv = document.getElementById("yearFilters");

    fuelDiv.innerHTML = "";
    yearDiv.innerHTML = "";

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
<input type="checkbox" value="${f}" class="fuelFilter" checked>
${f} (${count})
</label><br>
`;
    });

    /* YEAR */

    [...yearSet].sort().forEach(y => {

        const count = marketRows.filter(r => excelDateToYear(r[yearIndex]) === y).length;

        yearDiv.innerHTML += `
<label>
<input type="checkbox" value="${y}" class="yearFilter" checked>
${y} (${count})
</label><br>
`;
    });

    /* EVENT */

    document.querySelectorAll(".fuelFilter, .yearFilter").forEach(el => {
        el.addEventListener("change", calculateFilteredStats);
    });

}

/* -------- FILTERED CALC -------- */

function calculateFilteredStats() {

    const fuelContainer = document.getElementById("fuelFilters");
    const yearContainer = document.getElementById("yearFilters");

    const selectedFuel = [...fuelContainer.querySelectorAll(".fuelFilter:checked")]
        .map(e => e.value);

    const selectedYear = [...yearContainer.querySelectorAll(".yearFilter:checked")]
        .map(e => e.value);

    if (selectedFuel.length === 0 || selectedYear.length === 0) {
        document.getElementById("marketResult").innerHTML = `
<b>No data</b><br>
Please select at least one fuel type and year.
`;
        return;
    }

    let guide = [];
    let dat = [];
    let sale = [];

    marketRows.forEach(r => {

        const rowYear = excelDateToYear(r[yearIndex]);

        /* FILTER */

        if (selectedFuel.length && !selectedFuel.includes(r[fuelIndex])) return;

        if (selectedYear.length && (!rowYear || !selectedYear.includes(String(rowYear)))) return;

        /* VALUES */

        const g = parseNumber(r[guideIndex]);
        const d = parseNumber(r[datIndex]);
        const s = parseNumber(r[saleIndex]);

        if (g !== null) guide.push(g);
        if (d !== null) dat.push(d);
        if (s !== null) sale.push(s);

    });

    function stats(arr) {
        if (arr.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

        return {
            avg: arr.reduce((a, b) => a + b, 0) / arr.length,
            min: Math.min(...arr),
            max: Math.max(...arr)
        };
    }

    const sGuide = stats(guide);
    const sDat = stats(dat);
    const sSale = stats(sale);

    document.getElementById("marketResult").innerHTML = `
<b>Base Price</b><br>
Average: ${sGuide.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} Ft<br>
Min: ${sGuide.min.toLocaleString()} Ft<br>
Max: ${sGuide.max.toLocaleString()} Ft<br><br>

<b>DAT Price</b><br>
Average: ${sDat.avg.toLocaleString()} Ft<br>
Min: ${sDat.min.toLocaleString()} Ft<br>
Max: ${sDat.max.toLocaleString()} Ft<br><br>

<b>Sale Price</b><br>
Average: ${sSale.avg.toLocaleString()} Ft<br>
Min: ${sSale.min.toLocaleString()} Ft<br>
Max: ${sSale.max.toLocaleString()} Ft
`;
}
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

    const guideIndex = header.findIndex(h => h && h.toString().toLowerCase().includes("irány"));
    const datIndex = header.findIndex(h => {
        if (!h) return false;
        const t = h.toString().toLowerCase();
        return t.includes("dat") && t.includes("ár") && !t.includes("kód");
    });
    const saleIndex = header.findIndex(h => h && h.toString().toLowerCase().includes("elad"));

    let guide = [];
    let dat = [];
    let sale = [];

    function parseNumber(val) {

        if (val === null || val === undefined) return null;

        if (typeof val === "number") return val;

        if (typeof val === "string") {

            val = val.trim();

            if (val === "" || val === "-" || val === "–" || val === "—") return null;

            val = val.replace(/[^\d]/g, "");

        }

        const num = Number(val);
        return isNaN(num) ? null : num;

    }

    for (let i = 1; i < rows.length; i++) {

        const r = rows[i];

        const guideVal = parseNumber(r[guideIndex]);
        const datVal = parseNumber(r[datIndex]);
        const saleVal = parseNumber(r[saleIndex]);

        if (guideVal !== null) guide.push(guideVal);
        if (datVal !== null) dat.push(datVal);
        if (saleVal !== null) sale.push(saleVal);

    }

    function stats(arr) {

        if (arr.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

        return {
            avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
            min: Math.min(...arr),
            max: Math.max(...arr)
        };

    }

    const sGuide = stats(guide);
    const sDat = stats(dat);
    const sSale = stats(sale);

    document.getElementById("marketResult").innerHTML = `

<b>Guide Price</b><br>
Average: ${sGuide.avg.toLocaleString()} Ft<br>
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
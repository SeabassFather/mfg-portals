// Mexausa truck and trailer catalog builder. Node + pdfkit only.
// Usage: node build.js [outfile.pdf]
// Photos, highest priority first: photos/MFG-0001.jpg|png (supplier supplied), bendix-photos/, free-photos/.
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const ROOT = __dirname;
const OUT = process.argv[2] || path.join(ROOT, "..", "Mexausa_Truck_Trailer_Catalog.pdf");
const CSV = fs.existsSync(path.join(ROOT, "..", "catalog-parts.csv")) ? path.join(ROOT, "..", "catalog-parts.csv") : path.join(ROOT, "catalog-parts.csv");
const rows = fs.readFileSync(CSV, "utf8").trim().split(/\r?\n/).slice(1).map((l) => { const m = l.match(/^(MFG-\d{4}),"?(.*?)"?$/); return { code: m[1], name: m[2] }; });
if (rows.length !== 108) throw new Error("expected 108 parts, got " + rows.length);
const DESC = JSON.parse(fs.readFileSync(path.join(ROOT, "desc.json"), "utf8"));
const PARTS = JSON.parse(fs.readFileSync(path.join(ROOT, "parts.json"), "utf8"));
const FREE = JSON.parse(fs.readFileSync(path.join(ROOT, "free-photos", "credits.json"), "utf8"));

const photos = {}, source = {};
const scan = (dir, tag) => { if (!fs.existsSync(dir)) return; for (const f of fs.readdirSync(dir)) { const m = f.match(/^MFG-(\d{4})\.(jpe?g|png)$/i); if (m) { photos[+m[1]] = path.join(dir, f); source[+m[1]] = tag; } } };
scan(path.join(ROOT, "free-photos"), "free"); scan(path.join(ROOT, "bendix-photos"), "bendix"); scan(path.join(ROOT, "photos"), "supplied");

const CATS = [[1, 16, "Brake drums, discs and shoes"], [17, 24, "Brake chambers and adjusters"], [25, 34, "Air brake system"], [35, 43, "Hoses and fittings"], [44, 50, "Fuel system"], [51, 56, "Belts and tensioners"], [57, 66, "Wheel ends and bearings"], [67, 74, "Suspension"], [75, 81, "Trailer and coupling"], [82, 85, "Driveline"], [86, 92, "Cooling and filters"], [93, 98, "Electrical and lighting"], [99, 108, "Tapered roller bearing sets"]];
const cat = (n) => CATS.find((c) => n >= c[0] && n <= c[1])[2];
const PER = 4, FIRST = 4;
const pageOf = (n) => FIRST + Math.floor((n - 1) / PER);

const BLUE = "#1f5f8b", INK = "#22303c", MUTE = "#5d6b78", LINE = "#d5dde4", TINT = "#eef3f7";
const doc = new PDFDocument({ size: "LETTER", margin: 0, info: { Title: "Mexausa Truck and Trailer Parts Catalog", Author: "Mexausa Food Group, Inc.", Subject: "108 truck and trailer parts with part numbers. Request a quote at saul@mexausafg.com" } });
doc.pipe(fs.createWriteStream(OUT));
const W = 612, H = 792, M = 48;
let pageNo = 0;
function newPage() { if (pageNo) doc.addPage(); pageNo++; doc.rect(0, 0, W, H).fill("#ffffff"); }
function header(title) {
  doc.rect(0, 0, W, 46).fill(BLUE);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("MEXAUSA FOOD GROUP, INC.", M, 17, { lineBreak: false });
  doc.font("Helvetica").fontSize(10).text(title, 0, 18, { width: W - M, align: "right", lineBreak: false });
}
function footer() {
  doc.moveTo(M, H - 44).lineTo(W - M, H - 44).strokeColor(LINE).lineWidth(0.8).stroke();
  doc.fillColor(MUTE).font("Helvetica").fontSize(9).text("Request a quote: saul@mexausafg.com   |   mexausafg.com", M, H - 34, { lineBreak: false });
  doc.text("Page " + pageNo + " of 32", 0, H - 34, { width: W - M, align: "right", lineBreak: false });
}

// 1 cover
newPage();
doc.rect(0, 0, W, 360).fill(BLUE);
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("MEXAUSA FOOD GROUP, INC.", M, 70, { characterSpacing: 2 });
doc.font("Helvetica-Bold").fontSize(40).text("Truck and Trailer", M, 150).text("Parts Catalog", M, 196);
doc.font("Helvetica").fontSize(15).text("108 heavy-duty parts with part numbers. Request a quote, we confirm fit for your truck or trailer.", M, 262, { width: 440 });
doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text("How to order", M, 420);
doc.font("Helvetica").fontSize(12).fillColor(INK).text("Email the catalog or part numbers and quantities you need, along with the make, model and year of the truck or trailer, to:", M, 446, { width: 460 });
doc.font("Helvetica-Bold").fontSize(20).fillColor(BLUE).text("saul@mexausafg.com", M, 500);
doc.font("Helvetica").fontSize(14).fillColor(INK).text("mexausafg.com", M, 530);
doc.rect(M, 600, W - 2 * M, 100).fill(TINT);
doc.fillColor(INK).font("Helvetica").fontSize(11).text("Mexausa Food Group, Inc. is the only contact for pricing, availability and delivery. Every item in this catalog is quoted on request.", M + 18, 622, { width: W - 2 * M - 36, lineGap: 3 });

// 2 how to order
newPage(); header("How to order");
doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Ordering is simple", M, 92);
const steps = [["Find your parts", "Browse the 13 sections. Every item has a catalog number from MFG-0001 to MFG-0108, and most list the manufacturer part numbers we work with."], ["Send us your list", "Email saul@mexausafg.com with the catalog numbers or part numbers and how many of each you need."], ["Tell us the truck or trailer", "Include make, model, year and, if you have it, the VIN. We confirm fit before we quote."], ["Get your quote", "We reply with price, availability and delivery. Nothing ships until you approve."]];
let y = 150;
steps.forEach((s, i) => {
  doc.circle(M + 16, y + 16, 16).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text(String(i + 1), M, y + 9, { width: 32, align: "center" });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text(s[0], M + 50, y + 2); doc.font("Helvetica").fontSize(12).fillColor(MUTE).text(s[1], M + 50, y + 22, { width: 440 });
  y += 86;
});
doc.rect(M, 520, W - 2 * M, 150).fill(TINT);
doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Good to know", M + 18, 538);
doc.font("Helvetica").fontSize(11.5).text("Part numbers are manufacturer numbers shown for reference. Your quote confirms the exact part for your application.", M + 18, 562, { width: W - 2 * M - 36, lineGap: 3 });
doc.text("Photographs are representative of the type of part. Not every item has a photograph yet.", M + 18, 606, { width: W - 2 * M - 36 });
doc.text("Prices, stock and lead times are not listed. We quote each order.", M + 18, 636, { width: W - 2 * M - 36 });
footer();

// 3 contents
newPage(); header("Contents");
doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("What is in this catalog", M, 92);
y = 150;
CATS.forEach((c) => {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(c[2], M, y, { lineBreak: false });
  doc.font("Helvetica").fillColor(MUTE).fontSize(11).text("MFG-" + String(c[0]).padStart(4, "0") + " to MFG-" + String(c[1]).padStart(4, "0"), 330, y + 1, { lineBreak: false });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text("Page " + pageOf(c[0]), 0, y, { width: W - M, align: "right", lineBreak: false });
  doc.moveTo(M, y + 22).lineTo(W - M, y + 22).strokeColor(LINE).lineWidth(0.6).stroke();
  y += 40;
});
footer();

// part number block
function partsBlock(n, x, y0, w) {
  const list = PARTS[n];
  if (!list || !list.length) { doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(MUTE).text("Part number: send us your sample or tag and we will match it.", x, y0, { width: w, lineBreak: false }); return; }
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.5).text("PART NUMBERS", x, y0, { characterSpacing: 0.6, lineBreak: false });
  doc.y = y0 + 12; doc.x = x;
  list.forEach((e, i) => {
    const last = i === list.length - 1;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE).text(e.b + " ", x, undefined, { continued: true, width: w });
    doc.font("Helvetica").fillColor(INK).text(e.p.join(", ") + (e.note ? "  (" + e.note + ")" : ""), { continued: false, width: w, lineGap: 1 });
  });
}

// items
const SLOT = 154, TOP = 60;
for (let p = 0; p < 27; p++) {
  newPage();
  const first = p * PER;
  header(cat(first + 1));
  for (let i = 0; i < PER; i++) {
    const idx = first + i; const r = rows[idx]; const n = idx + 1; const top = TOP + i * SLOT + 10;
    if (i) doc.moveTo(M, top - 8).lineTo(W - M, top - 8).strokeColor(LINE).lineWidth(0.6).stroke();
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(9.5).text(r.code + "   " + cat(n).toUpperCase(), M, top + 2, { width: 340, lineBreak: false, characterSpacing: 0.5 });
    const nm = r.name.replace(/ [—-] (SET\d+)$/, " ($1)");
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(16).text(nm, M, top + 17, { width: 330, lineBreak: false });
    const d = DESC[String(n).padStart(4, "0")] || DESC.BEARING;
    doc.font("Helvetica").fontSize(10.5).fillColor(MUTE).text(d, M, top + 38, { width: 335, lineGap: 1.5, height: 28 });
    partsBlock(n, M, top + 68, 335);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text("Request a quote. We will confirm fit for your truck or trailer.", M, top + 128, { width: 335, lineBreak: false });
    if (photos[n]) {
      const bx = 400, by = top, bw = W - M - bx, bh = 118;
      doc.rect(bx, by, bw, bh).fill("#ffffff");
      doc.save(); doc.rect(bx, by, bw, bh).clip(); doc.image(photos[n], bx, by, { fit: [bw, bh], align: "center", valign: "center" }); doc.restore();
      doc.rect(bx, by, bw, bh).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.fillColor(MUTE).font("Helvetica-Oblique").fontSize(8).text(source[n] === "bendix" ? "Bendix product photo" : source[n] === "supplied" ? "Product photo" : "Representative photo", bx, by + bh + 3, { width: bw, align: "right", lineBreak: false });
    }
  }
  footer();
}

// 31 credits
newPage(); header("Photo credits");
doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Photo credits", M, 92);
doc.font("Helvetica").fontSize(11).fillColor(MUTE).text("Representative photographs, credited below.", M, 126, { width: W - 2 * M });
y = 156;
const bxItems = Object.keys(photos).filter((n) => source[n] === "bendix").map(Number).sort((a, b) => a - b);
if (bxItems.length) { doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text("Bendix product photographs", M, y, { lineBreak: false }); doc.font("Helvetica").fontSize(10).fillColor(MUTE).text("Items " + bxItems.map((n) => "MFG-" + String(n).padStart(4, "0")).join(", ") + ". Bendix is a registered trademark of its owner.", M + 12, y + 15, { width: W - 2 * M - 12 }); y += 58; }
Object.keys(photos).filter((n) => source[n] === "free").map(Number).sort((a, b) => a - b).forEach((n) => {
  const c = FREE["MFG-" + String(n).padStart(4, "0")]; if (!c) return;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text("MFG-" + String(n).padStart(4, "0") + "  " + rows[n - 1].name, M, y, { width: W - 2 * M, lineBreak: false });
  doc.font("Helvetica").fontSize(10).fillColor(MUTE).text("Photo: " + c.artist + ". License: " + c.license + ".", M + 12, y + 15, { width: W - 2 * M - 12, lineBreak: false });
  y += 36;
});
y += 6;
doc.fillColor(MUTE).font("Helvetica").fontSize(9.5).text("License terms: CC BY 3.0 at creativecommons.org/licenses/by/3.0/ ; CC BY-SA 3.0 at creativecommons.org/licenses/by-sa/3.0/ ; CC BY-SA 4.0 at creativecommons.org/licenses/by-sa/4.0/ . Public domain images carry no restriction.", M, y, { width: W - 2 * M, lineGap: 3 });
footer();

// 32 back
newPage(); header("Request a quote");
doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Request a quote", M, 92);
doc.font("Helvetica").fontSize(12.5).text("Copy this into an email to saul@mexausafg.com and fill in the blanks.", M, 130, { width: W - 2 * M });
doc.rect(M, 180, W - 2 * M, 330).fill(TINT);
["Company name:", "Contact name and phone:", "Delivery city and state:", "Truck or trailer make, model, year:", "VIN (if you have it):", "Catalog or part numbers and quantities:"].forEach((t, i) => {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(t, M + 20, 206 + i * 50, { lineBreak: false });
  doc.moveTo(M + 20, 206 + i * 50 + 30).lineTo(W - M - 20, 206 + i * 50 + 30).strokeColor("#b8c4ce").lineWidth(0.8).stroke();
});
doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(20).text("saul@mexausafg.com", M, 560);
doc.fillColor(INK).font("Helvetica").fontSize(14).text("mexausafg.com", M, 592);
doc.fillColor(MUTE).fontSize(10.5).text("Mexausa Food Group, Inc.", M, 640);
footer();
doc.end();
process.on("exit", () => console.log("pages", pageNo, "photos", Object.keys(photos).length, "items with part numbers", Object.keys(PARTS).length));

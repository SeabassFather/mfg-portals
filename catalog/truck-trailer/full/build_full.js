// Mexausa wholesale heavy-duty truck and trailer parts catalog - full build. Node + pdfkit only.
// Usage: node build_full.js <out.pdf> [maxBendixPages]
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const R = __dirname;
const OUT = process.argv[2] || path.join(R, "Mexausa_Truck_Trailer_Parts_Catalog.pdf");
const MAXPG = process.argv[3] ? +process.argv[3] : 99999;

// ---------- data ----------
const CRAWL = path.join(R, "crawl");
const OTHER = JSON.parse(fs.readFileSync(path.join(R, "other.json"), "utf8"));
const DESC = JSON.parse(fs.readFileSync(path.join(R, "guide", "desc.json"), "utf8"));
const GPARTS = JSON.parse(fs.readFileSync(path.join(R, "guide", "parts.json"), "utf8"));
const GFREE = JSON.parse(fs.readFileSync(path.join(R, "guide", "free-photos", "credits.json"), "utf8"));
const CSVROWS = fs.readFileSync(path.join(R, "guide", "catalog-parts.csv"), "utf8").trim().split(/\r?\n/).slice(1).map((l) => { const m = l.match(/^(MFG-\d{4}),"?(.*?)"?$/); return { code: m[1], name: m[2] }; });
const gphotos = {}, gsrc = {};
for (const [dir, tag] of [["free-photos", "free"], ["bendix-photos", "bendix"], ["photos", "supplied"]]) { const d = path.join(R, "guide", dir); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) { const m = f.match(/^MFG-(\d{4})\.(jpe?g|png)$/i); if (m) { gphotos[+m[1]] = path.join(d, f); gsrc[+m[1]] = tag; } } }

// Bendix groups
const files = fs.readdirSync(CRAWL).filter((f) => /^pg_s(30|40)_\d+\.json$/.test(f)).sort().slice(0, MAXPG);
const seenCode = new Set(); const groups = {};
for (const f of files) {
  for (const it of JSON.parse(fs.readFileSync(path.join(CRAWL, f), "utf8")).items) {
    if (seenCode.has(it.c)) continue; seenCode.add(it.c);
    const nm = (it.n || "Other").replace(/\s+/g, " ").trim(); const ty = (it.t || "").replace(/\s+/g, " ").trim();
    const k = nm + "|" + ty; (groups[k] = groups[k] || { name: nm, type: ty, items: [] }).items.push(it);
  }
}
const PH = fs.existsSync(path.join(R, "bxphotos.json")) ? JSON.parse(fs.readFileSync(path.join(R, "bxphotos.json"), "utf8")) : {};
const byName = {};
for (const g of Object.values(groups)) { (byName[g.name] = byName[g.name] || []).push(g); }
const names = Object.keys(byName).sort((a, b) => a.localeCompare(b));
for (const n of names) byName[n].sort((a, b) => a.type.localeCompare(b.type, undefined, { numeric: true }));
const natcmp = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const TOTAL_BX = seenCode.size;

// ---------- layout constants ----------
const W = 612, H = 792, M = 42;
const BLUE = "#1f5f8b", INK = "#22303c", MUTE = "#5d6b78", LINE = "#d5dde4", TINT = "#eef3f7", GRAY = "#8794a1";
const CONTENT_TOP = 62, CONTENT_BOT = H - 52;
const SECTIONS = [["guide", "Featured products: 108 items"], ["bendix", "Bendix: complete air brake and chassis parts"], ["wheelend", "Wheel ends: bearings, seals, hubs"], ["friction", "Friction: pads, shoes, drums, rotors"], ["fittings", "Air line fittings: DOT push-connect, compression, brass"], ["springs", "Trailer springs"], ["store", "Shop stock list"]];
const ROWS_PER_COL = 52, TOC_COLS = 3;
const tocRows = SECTIONS.length + names.length + 10;
const TOC_PAGES = Math.max(2, Math.ceil(tocRows / (ROWS_PER_COL * TOC_COLS)));
const FRONT = 2 + TOC_PAGES;

function run(marksIn, outFile) {
  const marks = {};
  const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true, info: { Title: "Mexausa Truck and Trailer Parts Catalog", Author: "Mexausa Food Group, Inc.", Subject: "Wholesale heavy-duty truck and trailer parts. Request a quote at saul@mexausafg.com" } });
  const ws = fs.createWriteStream(outFile); doc.pipe(ws);
  let pageNo = 0, curTitle = "";
  const newPage = (title) => { if (pageNo) doc.addPage(); pageNo++; curTitle = title || curTitle; doc.rect(0, 0, W, H).fill("#ffffff"); doc.rect(0, 0, W, 40).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("MEXAUSA FOOD GROUP, INC.", M, 15, { lineBreak: false }); doc.font("Helvetica").fontSize(9.5).text(curTitle, 0, 16, { width: W - M, align: "right", lineBreak: false }); };
  const mark = (k) => { marks[k] = pageNo; };
  const T = (s, x, y, o) => doc.text(s, x, y, Object.assign({ lineBreak: false }, o || {}));

  // ---- cover
  newPage("");
  doc.rect(0, 0, W, 380).fill(BLUE);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("MEXAUSA FOOD GROUP, INC.", M + 6, 70, { characterSpacing: 2 });
  doc.fontSize(40).text("Heavy-Duty Truck and", M + 6, 140).text("Trailer Parts Catalog", M + 6, 186);
  doc.font("Helvetica").fontSize(15).text("Wholesale distributor. Brakes, air system, wheel ends, friction, fittings, suspension and electrical. Thousands of part numbers.", M + 6, 262, { width: 470, lineGap: 3 });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text("How to order", M + 6, 430);
  doc.font("Helvetica").fontSize(12).text("Email the part numbers and quantities you need, with the make, model and year of the truck or trailer, to:", M + 6, 454, { width: 470 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(BLUE).text("saul@mexausafg.com", M + 6, 510);
  doc.font("Helvetica").fontSize(14).fillColor(INK).text("mexausafg.com", M + 6, 542);
  doc.rect(M + 6, 610, W - 2 * M - 12, 90).fill(TINT);
  doc.fillColor(INK).font("Helvetica").fontSize(11).text("Mexausa Food Group, Inc. is your only contact for pricing, availability and delivery. Every part in this catalog is quoted on request.", M + 24, 630, { width: W - 2 * M - 48, lineGap: 3 });

  // ---- about
  newPage("About this catalog");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Ordering from Mexausa", M, 80);
  const st = [["Find the part", "Browse by section. Part numbers are manufacturer numbers. Photos show the type of part."], ["Send your list", "Email saul@mexausafg.com with part numbers and quantities. A tag photo or the old part number is enough."], ["Tell us the truck or trailer", "Make, model, year and VIN if you have it. We confirm fit before we quote."], ["Get your quote", "We reply with price, availability and delivery. Nothing ships until you approve."]];
  let y = 130;
  st.forEach((s, i) => { doc.circle(M + 16, y + 16, 16).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15); T(String(i + 1), M, y + 9, { width: 32, align: "center" }); doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text(s[0], M + 50, y + 2); doc.font("Helvetica").fontSize(12).fillColor(MUTE).text(s[1], M + 50, y + 22, { width: 440 }); y += 78; });
  doc.rect(M, 470, W - 2 * M, 250).fill(TINT);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Reading this catalog", M + 18, 488);
  const notes = ["Bendix section: part numbers are listed under each product type. R after a number means remanufactured. OE means original-equipment grade.", "Part numbers shown are for reference. Listing a number is not a promise of stock or price. Every order is quoted.", "Bendix part numbers are for products Bendix lists as for sale. Bendix is a registered trademark of its owner.", "Brand names are used to identify the parts. Mexausa Food Group, Inc. is not affiliated with the brand owners.", "Photos are representative of the product type. Not every part has a photo."];
  let ny = 512; notes.forEach((n) => { doc.font("Helvetica").fontSize(10.5).fillColor(MUTE).text(n, M + 18, ny, { width: W - 2 * M - 36, lineGap: 2 }); ny += doc.heightOfString(n, { width: W - 2 * M - 36, lineGap: 2 }) + 8; });

  // ---- TOC pages (filled using marksIn)
  const tocEntries = [];
  SECTIONS.forEach((s) => { tocEntries.push({ lvl: 0, t: s[1], p: marksIn["sec_" + s[0]] }); if (s[0] === "bendix") names.forEach((n) => tocEntries.push({ lvl: 1, t: n, p: marksIn["bx_" + n] })); });
  for (let tp = 0; tp < TOC_PAGES; tp++) {
    newPage("Contents");
    if (tp === 0) { doc.fillColor(INK).font("Helvetica-Bold").fontSize(18); T("Contents", M, 54); }
    const perPage = ROWS_PER_COL * TOC_COLS, colW = (W - 2 * M) / TOC_COLS;
    const slice = tocEntries.slice(tp * perPage, (tp + 1) * perPage);
    slice.forEach((e, i) => {
      const col = Math.floor(i / ROWS_PER_COL), row = i % ROWS_PER_COL; const x = M + col * colW, yy = (tp === 0 ? 82 : 60) + row * 12.4;
      if (e.lvl === 0) { doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BLUE); T(e.t.slice(0, 40), x, yy, { width: colW - 30 }); } else { doc.font("Helvetica").fontSize(7.5).fillColor(INK); T(e.t.slice(0, 34), x + 6, yy, { width: colW - 40 }); }
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTE); T(e.p ? String(e.p) : "", x + colW - 30, yy, { width: 22, align: "right" });
    });
  }

  // ---- flow helpers
  let cy = CONTENT_TOP;
  const flowPage = (title) => { newPage(title); cy = CONTENT_TOP; };
  const need = (h, title) => { if (cy + h > CONTENT_BOT) flowPage(title); };

  // ---- Section 1: featured guide (108 items, 4 per page)
  newPage("Featured products"); mark("sec_guide"); cy = CONTENT_TOP;
  const gcat = [[1, 16, "Brake drums, discs and shoes"], [17, 24, "Brake chambers and adjusters"], [25, 34, "Air brake system"], [35, 43, "Hoses and fittings"], [44, 50, "Fuel system"], [51, 56, "Belts and tensioners"], [57, 66, "Wheel ends and bearings"], [67, 74, "Suspension"], [75, 81, "Trailer and coupling"], [82, 85, "Driveline"], [86, 92, "Cooling and filters"], [93, 98, "Electrical and lighting"], [99, 108, "Tapered roller bearing sets"]];
  const gc = (n) => gcat.find((c) => n >= c[0] && n <= c[1])[2];
  const partsBlock = (n, x, y0, w) => {
    const list = GPARTS[n];
    if (!list || !list.length) { doc.font("Helvetica-Oblique").fontSize(9).fillColor(MUTE); T("Part number: send your sample or tag and we will match it.", x, y0, { width: w }); return; }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8); T("PART NUMBERS", x, y0, { characterSpacing: 0.6 });
    doc.y = y0 + 11; doc.x = x;
    list.forEach((e) => { doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BLUE).text(e.b + " ", x, undefined, { continued: true, width: w }); doc.font("Helvetica").fillColor(INK).text(e.p.join(", ") + (e.note ? "  (" + e.note + ")" : ""), { continued: false, width: w, lineGap: 1 }); });
  };
  for (let p = 0; p < 27; p++) {
    if (p > 0) newPage("Featured products");
    for (let i = 0; i < 4; i++) {
      const idx = p * 4 + i, n = idx + 1, r = CSVROWS[idx], top = 52 + i * 166;
      if (i) doc.moveTo(M, top - 8).lineTo(W - M, top - 8).strokeColor(LINE).lineWidth(0.6).stroke();
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(9); T(r.code + "   " + gc(n).toUpperCase(), M, top + 4, { characterSpacing: 0.5 });
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(16); T(r.name.replace(/ [—-] (SET\d+)$/, " ($1)"), M, top + 20, { width: 340 });
      doc.font("Helvetica").fontSize(10.5).fillColor(MUTE).text(DESC[String(n).padStart(4, "0")] || DESC.BEARING, M, top + 42, { width: 340, lineGap: 1.5, height: 28 });
      partsBlock(n, M, top + 74, 340);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK); T("Request a quote. We will confirm fit for your truck or trailer.", M, top + 140, { width: 340 });
      if (gphotos[n]) { const bx = 400, bw = W - M - bx, bh = 124; doc.rect(bx, top, bw, bh).fill("#ffffff"); doc.save(); doc.rect(bx, top, bw, bh).clip(); doc.image(gphotos[n], bx, top, { fit: [bw, bh], align: "center", valign: "center" }); doc.restore(); doc.rect(bx, top, bw, bh).lineWidth(0.6).strokeColor(LINE).stroke(); doc.fillColor(MUTE).font("Helvetica-Oblique").fontSize(7.5); T(gsrc[n] === "bendix" ? "Bendix product photo" : gsrc[n] === "supplied" ? "Product photo" : "Representative photo", bx, top + bh + 3, { width: bw, align: "right" }); }
    }
  }

  // ---- Section 2: Bendix
  flowPage("Bendix parts"); mark("sec_bendix");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20); T("Bendix parts", M, cy); cy += 26;
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTE); T(TOTAL_BX.toLocaleString("en-US") + " part numbers in " + names.length + " product families. R = remanufactured. OE = original-equipment grade. Quote on request.", M, cy, { width: W - 2 * M }); cy += 22;
  const CODEW = 80, ROWH = 9.4, PHOTO = 92;
  for (const nm of names) {
    need(110, "Bendix parts"); if (!marks["bx_" + nm]) mark("bx_" + nm);
    doc.rect(M, cy, W - 2 * M, 15).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9.5); T(nm.toUpperCase().slice(0, 70), M + 6, cy + 3.5); cy += 20;
    for (const g of byName[nm]) {
      const ph = PH[g.name + "|" + g.type]; const hasPh = ph && fs.existsSync(path.join(R, ph));
      const items = g.items.slice().sort((a, b) => natcmp(a.c, b.c));
      let idx = 0, first = true;
      while (idx < items.length) {
        const left = hasPh && first ? PHOTO + 8 : 0; const cols = Math.max(2, Math.floor((W - 2 * M - left) / CODEW));
        const headH = 13; const minH = headH + 2 * ROWH + (hasPh && first ? PHOTO - headH : 0);
        if (cy + minH > CONTENT_BOT) { flowPage("Bendix parts"); }
        const avail = Math.floor((CONTENT_BOT - cy - headH) / ROWH);
        const rowsWant = Math.ceil((items.length - idx) / cols); const rows = Math.min(avail, rowsWant);
        const blockH = headH + Math.max(rows * ROWH, hasPh && first ? PHOTO - headH : 0);
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.5); T((g.type ? g.type + "  " : "") + g.name + (first ? "   (" + items.length + " part number" + (items.length === 1 ? "" : "s") + ")" : "   (continued)"), M + left, cy, { width: W - 2 * M - left });
        if (hasPh && first) { doc.rect(M, cy, PHOTO, PHOTO).fill("#ffffff"); doc.image(path.join(R, ph), M, cy, { fit: [PHOTO, PHOTO], align: "center", valign: "center" }); doc.rect(M, cy, PHOTO, PHOTO).lineWidth(0.5).strokeColor(LINE).stroke(); }
        const take = Math.min(rows * cols, items.length - idx);
        for (let k = 0; k < take; k++) { const it = items[idx + k]; const col = k % cols, row = Math.floor(k / cols); const x = M + left + col * CODEW, yy = cy + headH + row * ROWH; doc.font("Courier").fontSize(7.5).fillColor(INK); T(it.c.slice(0, 15), x, yy); const fl = /Remanufactured/i.test(it.m) ? "R" : /Original/i.test(it.m) ? "OE" : ""; if (fl) { doc.font("Helvetica-Bold").fontSize(6).fillColor(GRAY); T(fl, x + Math.min(it.c.length, 15) * 4.5 + 2, yy + 1); } }
        idx += take; cy += blockH + 5; first = false;
        if (idx < items.length) flowPage("Bendix parts");
      }
    }
  }

  // ---- tables helper
  const heading = (t, sub) => { need(40, curTitle); doc.fillColor(INK).font("Helvetica-Bold").fontSize(18); T(t, M, cy); cy += 24; if (sub) { doc.font("Helvetica").fontSize(9.5).fillColor(MUTE); T(sub, M, cy, { width: W - 2 * M }); cy += 18; } };
  const band = (t) => { need(40, curTitle); doc.rect(M, cy, W - 2 * M, 15).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9.5); T(t.slice(0, 90), M + 6, cy + 3.5); cy += 20; };
  const lines = (txt, font, size, color, x, w, lh) => { doc.font(font).fontSize(size).fillColor(color); const h = doc.heightOfString(txt, { width: w, lineGap: lh || 1 }); need(h + 2, curTitle); doc.text(txt, x, cy, { width: w, lineGap: lh || 1 }); cy += h + 3; };

  // ---- Section 3: wheel ends
  flowPage("Wheel ends"); mark("sec_wheelend");
  heading("Wheel ends: bearings, seals, hubs", "Timken, ConMet, SKF, National, Stemco and RevHD. Cone and cup numbers by set. Quote on request; we confirm fit.");
  const G = OTHER.desk.groups;
  band("Wheel bearing sets (Timken, with ConMet PreSet)");
  for (const g of G.filter((x) => x.cat === "bearing")) lines(g.title + "  -  " + g.members.map((m) => m.brand + " " + m.pn).join("  |  "), "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  band("Wheel seals (Stemco, RevHD, SKF, National)");
  for (const g of G.filter((x) => x.cat === "seal")) { lines(g.title, "Helvetica-Bold", 8.5, BLUE, M, W - 2 * M, 1); lines(g.members.map((m) => m.brand + " " + m.pn + (m.line ? " (" + m.line + ")" : "")).join("  |  "), "Helvetica", 8, INK, M + 8, W - 2 * M - 8, 1); }
  band("Hub caps and spindle nuts");
  for (const g of G.filter((x) => x.cat === "hubcap" || x.cat === "nut")) lines(g.title + "  -  " + g.members.map((m) => m.brand + " " + m.pn).join("  |  "), "Helvetica", 8.5, INK, M, W - 2 * M, 1);

  // ---- Section 4: friction
  flowPage("Friction"); mark("sec_friction");
  heading("Friction: pads, shoes, drums, rotors", "Air disc pads with the caliper each one fits, shoes and lining, drums and rotors with cross-reference numbers.");
  band("Air disc brake pads");
  for (const g of G.filter((x) => x.cat === "pad")) lines(g.title.replace(/^(Bremskerl|Automann) air disc brake pads /, "$1  "), "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  band("Hydraulic brake pads");
  for (const g of G.filter((x) => x.cat === "hydpad")) lines(g.title, "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  band("Brake shoes, lining and drums");
  for (const s of OTHER.store.filter((x) => x.cat === "brakes")) lines(s.brand + "  " + s.pn + "  -  " + s.en, "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  for (const g of G.filter((x) => x.cat === "drum")) lines(g.title, "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  band("Disc brake rotors and hub-rotor assemblies (with cross-reference numbers)");
  for (const r of OTHER.inv.filter((x) => x.cat === "rotor")) lines(r.pn + "  -  " + (r.d || "Rotor") + (r.x ? "  -  cross-reference: " + r.x : ""), "Helvetica", 8, INK, M, W - 2 * M, 1);

  // ---- Section 5: fittings
  flowPage("Fittings"); mark("sec_fittings");
  heading("Air line fittings", "DOT push-connect, DOT compression, brass, Velvac and Automann. Sizes in inches. Quote on request.");
  const FC = [["push", "DOT push-connect fittings (Push-to-Connect)"], ["comp", "DOT compression and bulkhead fittings"], ["velvac", "Velvac push-lock and compression"], ["brass", "Brass compression fittings"], ["automann", "Automann PLC and DOT fittings"]];
  for (const [c, label] of FC) {
    band(label);
    const bySeries = {}; for (const i of OTHER.inv.filter((x) => x.cat === c)) (bySeries[i.d] = bySeries[i.d] || []).push(i);
    for (const [d, arr] of Object.entries(bySeries)) {
      lines(d + "  (" + arr.length + ")", "Helvetica-Bold", 8.5, BLUE, M, W - 2 * M, 1);
      lines(arr.map((i) => i.pn + (i.x ? " [" + i.x.replace(" pulg", " in") + "]" : "")).join("   "), "Courier", 7.5, INK, M + 8, W - 2 * M - 8, 1.5);
    }
  }

  // ---- Section 6: springs
  flowPage("Trailer springs"); mark("sec_springs");
  heading("Trailer leaf springs", "Triangle Spring, Automann, Dexter and cross references. DE = double eye, SL = slipper. Quote on request.");
  for (const s of OTHER.desk.springs) lines(s.brand + "  " + s.pn + "  -  " + (s.style === "DE" ? "double eye" : s.style === "SL" ? "slipper" : s.style) + (s.len ? ", " + s.len + " in long" : "") + (s.w ? ", " + s.w + " in wide" : "") + (s.leaves ? ", " + s.leaves + " leaf" : "") + (s.cap && s.cap !== "measure" ? ", capacity " + s.cap + " lb" : "") + (s.axle && s.axle !== "measure" ? ", axle " + s.axle : "") + ((s.xref || []).length ? "  -  cross-reference: " + s.xref.join(", ") : ""), "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  band("Cross-reference: common trailer spring numbers");
  for (const x of OTHER.xrefs) lines(x.pn + "  -  " + (x.style === "DE" ? "double eye" : "slipper") + ", " + x.len + " in, " + x.leaves + " leaf, " + x.cap + " lb  -  also: " + (x.xref || []).join(", "), "Helvetica", 8.5, INK, M, W - 2 * M, 1);

  // ---- Section 7: store list
  flowPage("Shop stock list"); mark("sec_store");
  heading("Shop stock list", "Parts and brands we handle through the shop: brakes, air, ABS, clutch, wheel end, steering, suspension, coupling, lighting, filters and hardware.");
  const SC = { brakes: "Brakes", air: "Air brake", abs: "ABS", clutch: "Clutch", wheel: "Wheel end", steer: "Steering", susp: "Suspension", couple: "Coupling", light: "Lighting", filter: "Filtration", hardware: "Hardware" };
  for (const [k, lab] of Object.entries(SC)) { const arr = OTHER.store.filter((x) => x.cat === k); if (!arr.length) continue; band(lab); for (const s of arr) lines(s.brand + "  " + s.pn + "  -  " + s.en, "Helvetica", 8.5, INK, M, W - 2 * M, 1); }

  // ---- back page
  newPage("Request a quote"); mark("sec_back");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Request a quote", M, 90);
  doc.font("Helvetica").fontSize(12.5).text("Copy this into an email to saul@mexausafg.com and fill in the blanks.", M, 128, { width: W - 2 * M });
  doc.rect(M, 175, W - 2 * M, 330).fill(TINT);
  ["Company name:", "Contact name and phone:", "Delivery city and state:", "Truck or trailer make, model, year:", "VIN (if you have it):", "Part numbers and quantities:"].forEach((t, i) => { doc.fillColor(INK).font("Helvetica-Bold").fontSize(12); T(t, M + 20, 200 + i * 50); doc.moveTo(M + 20, 200 + i * 50 + 30).lineTo(W - M - 20, 200 + i * 50 + 30).strokeColor("#b8c4ce").lineWidth(0.8).stroke(); });
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(20).text("saul@mexausafg.com", M, 555);
  doc.fillColor(INK).font("Helvetica").fontSize(14).text("mexausafg.com", M, 587);
  doc.fillColor(MUTE).fontSize(10.5).text("Mexausa Food Group, Inc.", M, 635);

  // ---- footers
  const range = doc.bufferedPageRange(); const total = range.count;
  for (let i = 0; i < total; i++) { doc.switchToPage(i); doc.moveTo(M, H - 44).lineTo(W - M, H - 44).strokeColor(LINE).lineWidth(0.8).stroke(); doc.fillColor(MUTE).font("Helvetica").fontSize(8.5); doc.text("Request a quote: saul@mexausafg.com   |   mexausafg.com", M, H - 34, { lineBreak: false }); doc.text("Page " + (i + 1) + " of " + total, 0, H - 34, { width: W - M, align: "right", lineBreak: false }); }
  doc.flushPages(); doc.end();
  return new Promise((res) => ws.on("finish", () => res({ marks, total })));
}

(async () => {
  const tmp = OUT + ".pass1";
  const p1 = await run({}, tmp); fs.unlinkSync(tmp);
  const p2 = await run(p1.marks, OUT);
  console.log("pages", p2.total, "bendix parts", TOTAL_BX, "families", names.length, "photos on", Object.keys(PH).length, "groups");
})();

// Mexausa wholesale heavy-duty truck and trailer parts catalog - bilingual (English / Spanish). Node + pdfkit only.
// Usage: node build_full.js <out.pdf> [maxBendixPages]
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const R = __dirname;
const I = require("./i18n.js");
const ES = I.G;
const OUT = process.argv[2] || path.join(R, "Mexausa_Truck_Trailer_Parts_Catalog.pdf");
const MAXPG = process.argv[3] ? +process.argv[3] : 99999;

// ---------- data ----------
const CRAWL = path.join(R, "crawl");
const OTHER = JSON.parse(fs.readFileSync(path.join(R, "other.json"), "utf8"));
const DESC = JSON.parse(fs.readFileSync(path.join(R, "guide", "desc.json"), "utf8"));
const GPARTS = JSON.parse(fs.readFileSync(path.join(R, "guide", "parts.json"), "utf8"));
const CSVROWS = fs.readFileSync(path.join(R, "guide", "catalog-parts.csv"), "utf8").trim().split(/\r?\n/).slice(1).map((l) => { const m = l.match(/^(MFG-\d{4}),"?(.*?)"?$/); return { code: m[1], name: m[2] }; });
const gphotos = {}, gsrc = {};
for (const [dir, tag] of [["free-photos", "free"], ["bendix-photos", "bendix"], ["photos", "supplied"]]) { const d = path.join(R, "guide", dir); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) { const m = f.match(/^MFG-(\d{4})\.(jpe?g|png)$/i); if (m) { gphotos[+m[1]] = path.join(d, f); gsrc[+m[1]] = tag; } } }

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
const bxEs = (n) => I.bxEs(n);
const bi = (en, es) => (es && es !== en ? en + " / " + es : en);

// ---------- layout constants ----------
const W = 612, H = 792, M = 42;
const BLUE = "#1f5f8b", INK = "#22303c", MUTE = "#5d6b78", LINE = "#d5dde4", TINT = "#eef3f7", GRAY = "#8794a1";
const CONTENT_TOP = 62, CONTENT_BOT = H - 52;
const SECTIONS = [["guide", "Featured products: 108 items", "Productos destacados: 108 artículos"], ["bendix", "Bendix: complete air brake and chassis parts", "Bendix: refacciones completas de frenos de aire y chasis"], ["wheelend", "Wheel ends: bearings, seals, hubs", "Puntas de eje: rodamientos, retenes, mazas"], ["friction", "Friction: pads, shoes, drums, rotors", "Fricción: pastillas, zapatas, tambores, rotores"], ["fittings", "Air line fittings", "Conexiones de línea de aire"], ["springs", "Trailer springs", "Muelles de remolque"], ["store", "Shop stock list", "Lista de refacciones del taller"]];
const TOCSEC = { guide: "Featured products / Productos destacados", bendix: "Bendix parts / Refacciones Bendix", wheelend: "Wheel ends / Puntas de eje", friction: "Friction / Fricción", fittings: "Air line fittings / Conexiones de aire", springs: "Trailer springs / Muelles de remolque", store: "Shop stock list / Lista del taller" };
const ROWS_PER_COL = 54, TOC_COLS = 2;
const tocRows = SECTIONS.length + names.length + 10;
const TOC_PAGES = Math.max(2, Math.ceil(tocRows / (ROWS_PER_COL * TOC_COLS)));

function run(marksIn, outFile) {
  const marks = {};
  const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true, info: { Title: "Mexausa Truck and Trailer Parts Catalog / Catalogo de Refacciones para Camiones y Remolques", Author: "Mexausa Food Group, Inc.", Subject: "Wholesale heavy-duty truck and trailer parts. Request a quote at saul@mexausafg.com" } });
  const ws = fs.createWriteStream(outFile); doc.pipe(ws);
  let pageNo = 0, curTitle = "";
  const newPage = (title) => { if (pageNo) doc.addPage(); pageNo++; curTitle = title || curTitle; doc.rect(0, 0, W, H).fill("#ffffff"); doc.rect(0, 0, W, 40).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("MEXAUSA FOOD GROUP, INC.", M, 15, { lineBreak: false }); doc.font("Helvetica").fontSize(9.5).text(curTitle, 0, 16, { width: W - M, align: "right", lineBreak: false }); };
  const mark = (k) => { marks[k] = pageNo; };
  const T = (s, x, y, o) => doc.text(s, x, y, Object.assign({ lineBreak: false }, o || {}));
  const fitText = (s, w, font, size) => { doc.font(font).fontSize(size); let t = s; while (t.length > 4 && doc.widthOfString(t) > w) t = t.slice(0, -2); return t === s ? s : t.replace(/\s+\S*$/, "") + "..."; };

  // ---- cover
  newPage("");
  doc.rect(0, 0, W, 400).fill(BLUE);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("MEXAUSA FOOD GROUP, INC.", M + 6, 60, { characterSpacing: 2 });
  doc.fontSize(36).text("Heavy-Duty Truck and", M + 6, 110).text("Trailer Parts Catalog", M + 6, 150);
  doc.font("Helvetica-Bold").fontSize(21).text("Catálogo de refacciones para camiones", M + 6, 214).text("y remolques de trabajo pesado", M + 6, 240);
  doc.font("Helvetica").fontSize(12.5).text("Wholesale distributor. Brakes, air system, wheel ends, friction, fittings, suspension and electrical. Thousands of part numbers.", M + 6, 292, { width: 480, lineGap: 2 });
  doc.fontSize(12.5).text("Distribuidor mayorista. Frenos, sistema de aire, puntas de eje, fricción, conexiones, suspensión y sistema eléctrico. Miles de números de parte.", M + 6, 336, { width: 480, lineGap: 2 });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text("How to order / Cómo ordenar", M + 6, 424);
  doc.font("Helvetica").fontSize(11.5).text("Email the part numbers and quantities you need, with the make, model and year of the truck or trailer, to:", M + 6, 448, { width: 480 });
  doc.fillColor(MUTE).text("Envíe por correo los números de parte y cantidades que necesita, con marca, modelo y año del camión o remolque, a:", M + 6, 480, { width: 480 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor(BLUE).text("saul@mexausafg.com", M + 6, 524);
  doc.font("Helvetica").fontSize(14).fillColor(INK).text("mexausafg.com", M + 6, 556);
  doc.rect(M + 6, 604, W - 2 * M - 12, 110).fill(TINT);
  doc.fillColor(INK).font("Helvetica").fontSize(10.5).text("Mexausa Food Group, Inc. is your only contact for pricing, availability and delivery. Every part in this catalog is quoted on request.", M + 22, 618, { width: W - 2 * M - 44, lineGap: 2 });
  doc.fillColor(MUTE).text("Mexausa Food Group, Inc. es su único contacto para precios, disponibilidad y entrega. Cada pieza de este catálogo se cotiza bajo solicitud.", M + 22, 662, { width: W - 2 * M - 44, lineGap: 2 });

  // ---- about (2 pages)
  newPage("About this catalog / Acerca de este catálogo");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Ordering from Mexausa", M, 70);
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(15).text("Cómo ordenar con Mexausa", M, 98);
  const st = [["Find the part / Encuentre la pieza", "Browse by section. Part numbers are manufacturer numbers. Photos show the type of part.", "Busque por sección. Los números de parte son los del fabricante. Las fotos muestran el tipo de pieza."], ["Send your list / Envíe su lista", "Email saul@mexausafg.com with part numbers and quantities. A tag photo or the old part number is enough.", "Escriba a saul@mexausafg.com con números de parte y cantidades. Basta una foto de la etiqueta o el número de la pieza anterior."], ["Tell us the truck or trailer / Díganos el camión o remolque", "Make, model, year and VIN if you have it. We confirm fit before we quote.", "Marca, modelo, año y VIN si lo tiene. Confirmamos que la pieza le quede antes de cotizar."], ["Get your quote / Reciba su cotización", "We reply with price, availability and delivery. Nothing ships until you approve.", "Respondemos con precio, disponibilidad y entrega. No se envía nada hasta que usted apruebe."]];
  let y = 150;
  st.forEach((s, i) => { doc.circle(M + 16, y + 16, 16).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15); T(String(i + 1), M, y + 9, { width: 32, align: "center" }); doc.fillColor(INK).font("Helvetica-Bold").fontSize(13.5).text(s[0], M + 50, y + 2, { width: 450 }); doc.font("Helvetica").fontSize(11.5).fillColor(INK).text(s[1], M + 50, y + 22, { width: 450 }); doc.fillColor(MUTE).text(s[2], M + 50, y + 22 + doc.heightOfString(s[1], { width: 450 }) + 3, { width: 450 }); y += 128; });
  newPage("About this catalog / Acerca de este catálogo");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text("Reading this catalog", M, 70);
  doc.fillColor(BLUE).fontSize(14).text("Cómo leer este catálogo", M, 96);
  const notes = [["Bendix section: part numbers are listed under each product type. R after a number means remanufactured. OE means original-equipment grade.", "Sección Bendix: los números de parte se listan bajo cada tipo de producto. R después del número significa remanufacturado. OE significa grado de equipo original."], ["Part numbers shown are for reference. Listing a number is not a promise of stock or price. Every order is quoted.", "Los números de parte son de referencia. Listar un número no garantiza existencia ni precio. Cada pedido se cotiza."], ["Bendix part numbers are for products Bendix lists as for sale. Bendix is a registered trademark of its owner.", "Los números Bendix corresponden a productos que Bendix lista como disponibles para la venta. Bendix es marca registrada de su propietario."], ["Brand names are used to identify the parts. Mexausa Food Group, Inc. is not affiliated with the brand owners.", "Las marcas se usan para identificar las piezas. Mexausa Food Group, Inc. no está afiliada a los propietarios de las marcas."], ["Photos are representative of the product type. Not every part has a photo.", "Las fotos son representativas del tipo de producto. No todas las piezas tienen foto."], ["Sizes are in inches unless noted.", "Las medidas están en pulgadas salvo que se indique otra unidad."]];
  let ny = 140; notes.forEach((n) => { doc.font("Helvetica").fontSize(11).fillColor(INK).text(n[0], M, ny, { width: W - 2 * M, lineGap: 2 }); ny += doc.heightOfString(n[0], { width: W - 2 * M, lineGap: 2 }) + 3; doc.fillColor(MUTE).text(n[1], M, ny, { width: W - 2 * M, lineGap: 2 }); ny += doc.heightOfString(n[1], { width: W - 2 * M, lineGap: 2 }) + 18; });

  // ---- TOC
  const tocEntries = [];
  SECTIONS.forEach((s) => { tocEntries.push({ lvl: 0, t: TOCSEC[s[0]], p: marksIn["sec_" + s[0]] }); if (s[0] === "bendix") names.forEach((n) => tocEntries.push({ lvl: 1, t: bi(n, bxEs(n)), p: marksIn["bx_" + n] })); });
  const colW = (W - 2 * M) / TOC_COLS;
  for (let tp = 0; tp < TOC_PAGES; tp++) {
    newPage("Contents / Contenido");
    if (tp === 0) { doc.fillColor(INK).font("Helvetica-Bold").fontSize(18); T("Contents / Contenido", M, 54); }
    const perPage = ROWS_PER_COL * TOC_COLS;
    tocEntries.slice(tp * perPage, (tp + 1) * perPage).forEach((e, i) => {
      const col = Math.floor(i / ROWS_PER_COL), row = i % ROWS_PER_COL; const x = M + col * colW, yy = (tp === 0 ? 82 : 60) + row * 12.2;
      if (e.lvl === 0) { doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BLUE); T(fitText(e.t, colW - 46, "Helvetica-Bold", 7.5), x, yy); } else { doc.font("Helvetica").fontSize(7.2).fillColor(INK); T(fitText(e.t, colW - 54, "Helvetica", 7.2), x + 6, yy); }
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTE); T(e.p ? String(e.p) : "", x + colW - 36, yy, { width: 24, align: "right" });
    });
  }

  // ---- flow helpers
  let cy = CONTENT_TOP;
  const flowPage = (title) => { newPage(title); cy = CONTENT_TOP; };
  const need = (h, title) => { if (cy + h > CONTENT_BOT) flowPage(title); };

  // ---- Section 1: featured guide (108 items, 3 per page)
  newPage("Featured products / Productos destacados"); mark("sec_guide"); cy = CONTENT_TOP;
  const gcat = [[1, 16, "Brake drums, discs and shoes", "Tambores, discos y zapatas de freno"], [17, 24, "Brake chambers and adjusters", "Cámaras y ajustadores de freno"], [25, 34, "Air brake system", "Sistema de freno de aire"], [35, 43, "Hoses and fittings", "Mangueras y conexiones"], [44, 50, "Fuel system", "Sistema de combustible"], [51, 56, "Belts and tensioners", "Bandas y tensores"], [57, 66, "Wheel ends and bearings", "Puntas de eje y rodamientos"], [67, 74, "Suspension", "Suspensión"], [75, 81, "Trailer and coupling", "Remolque y acoplamiento"], [82, 85, "Driveline", "Línea de transmisión"], [86, 92, "Cooling and filters", "Enfriamiento y filtros"], [93, 98, "Electrical and lighting", "Sistema eléctrico e iluminación"], [99, 108, "Tapered roller bearing sets", "Juegos de rodamientos cónicos"]];
  const gc = (n) => gcat.find((c) => n >= c[0] && n <= c[1]);
  const noteEs = (n) => I.NOTES[n] || "";
  const partsBlock = (n, x, y0, w) => {
    const list = GPARTS[n];
    if (!list || !list.length) { doc.font("Helvetica-Oblique").fontSize(9).fillColor(MUTE); T("Part number: send your sample or tag and we will match it.", x, y0, { width: w }); T("Número de parte: envíenos su muestra o etiqueta y la identificamos.", x, y0 + 12, { width: w }); return; }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8); T("PART NUMBERS / NÚMEROS DE PARTE", x, y0, { characterSpacing: 0.5 });
    doc.y = y0 + 11; doc.x = x;
    list.forEach((e) => { const nt = e.note ? "  (" + (noteEs(e.note) ? e.note + " / " + noteEs(e.note) : e.note) + ")" : ""; doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BLUE).text(I.brandFix(e.b) + " ", x, undefined, { continued: true, width: w }); doc.font("Helvetica").fillColor(INK).text(e.p.map((p) => p.replace(/more sizes$/, "more sizes / más medidas")).join(", ") + nt, { continued: false, width: w, lineGap: 1 }); });
  };
  const _unused = { guide: "Featured products / Productos destacados", bendix: "Bendix parts / Refacciones Bendix", wheelend: "Wheel ends / Puntas de eje", friction: "Friction / Fricción", fittings: "Air line fittings / Conexiones de aire", springs: "Trailer springs / Muelles de remolque", store: "Shop stock list / Lista del taller" };
  let top = 56, first = true;
  for (let idx = 0; idx < 108; idx++) {
    const n = idx + 1, r = CSVROWS[idx]; const hasPhoto = !!gphotos[n];
    if (top + (hasPhoto ? 215 : 160) > 748) { newPage("Featured products / Productos destacados"); top = 56; first = true; }
    if (!first) doc.moveTo(M, top - 9).lineTo(W - M, top - 9).strokeColor(LINE).lineWidth(0.6).stroke();
    first = false;
    const c = gc(n);
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(9); T(fitText(r.code + "   " + (c[2] + " / " + c[3]).toUpperCase(), hasPhoto ? 345 : W - 2 * M, "Helvetica-Bold", 9), M, top + 2, { characterSpacing: 0 });
    const nameEn = r.name.replace(/ [\u2014-] (SET\d+)$/, " ($1)"); const nameEs = ES.names[String(n).padStart(4, "0")] || (n >= 99 ? "Juego de rodamientos cónicos (" + (r.name.match(/SET\d+/) || [""])[0] + ")" : "");
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(16); T(nameEn, M, top + 17, { width: 340 });
    doc.fillColor(BLUE).font("Helvetica-BoldOblique").fontSize(11.5); T(nameEs, M, top + 37, { width: 340 });
    const dEn = DESC[String(n).padStart(4, "0")] || DESC.BEARING, dEs = ES.descs[String(n).padStart(4, "0")] || ES.descs.BEARING;
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTE).text(dEn, M, top + 55, { width: 340, lineGap: 1, height: 24 });
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(MUTE).text(dEs, M, top + 82, { width: 340, lineGap: 1, height: 24 });
    partsBlock(n, M, top + 112, 340);
    const hasList = GPARTS[n] && GPARTS[n].length; let qy = (hasList ? doc.y : top + 112 + 26) + 8; if (hasPhoto) qy = Math.max(qy, top + 184);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK); T("Request a quote. We will confirm fit for your truck or trailer.", M, qy, { width: 340 });
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(MUTE); T("Solicite cotización. Confirmamos que la pieza le quede a su camión o remolque.", M, qy + 12, { width: 345 });
    if (hasPhoto) { const bx = 392, bw = W - M - bx, bh = 170; doc.rect(bx, top, bw, bh).fill("#ffffff"); doc.save(); doc.rect(bx, top, bw, bh).clip(); doc.image(gphotos[n], bx, top, { fit: [bw, bh], align: "center", valign: "center" }); doc.restore(); doc.rect(bx, top, bw, bh).lineWidth(0.6).strokeColor(LINE).stroke(); doc.fillColor(MUTE).font("Helvetica-Oblique").fontSize(7.5); T(gsrc[n] === "bendix" ? "Bendix product photo / Foto de producto Bendix" : gsrc[n] === "supplied" ? "Product photo / Foto del producto" : "Representative photo / Foto representativa", bx, top + bh + 3, { width: bw, align: "right" }); }
    top = qy + 12 + 22;
  }

  // ---- Section 2: Bendix
  flowPage("Bendix parts / Refacciones Bendix"); mark("sec_bendix");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20); T("Bendix parts / Refacciones Bendix", M, cy); cy += 26;
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTE); T(TOTAL_BX.toLocaleString("en-US") + " part numbers in " + names.length + " product families. R = remanufactured. OE = original-equipment grade. Quote on request.", M, cy, { width: W - 2 * M }); cy += 13;
  T(TOTAL_BX.toLocaleString("en-US") + " números de parte en " + names.length + " familias de producto. R = remanufacturado. OE = grado de equipo original. Cotización bajo solicitud.", M, cy, { width: W - 2 * M }); cy += 22;
  const CODEW = 80, ROWH = 9.4, PHOTO = 92;
  for (const nm of names) {
    need(110, "Bendix parts / Refacciones Bendix"); if (!marks["bx_" + nm]) mark("bx_" + nm);
    doc.rect(M, cy, W - 2 * M, 15).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9); T(fitText(bi(nm, bxEs(nm)).toUpperCase(), W - 2 * M - 12, "Helvetica-Bold", 9), M + 6, cy + 3.8); cy += 20;
    for (const g of byName[nm]) {
      const ph = PH[g.name + "|" + g.type]; const hasPh = ph && fs.existsSync(path.join(R, ph));
      const items = g.items.slice().sort((a, b) => natcmp(a.c, b.c));
      let idx = 0, first = true;
      while (idx < items.length) {
        const left = hasPh && first ? PHOTO + 8 : 0; const cols = Math.max(2, Math.floor((W - 2 * M - left) / CODEW));
        const headH = 13; const minH = headH + 2 * ROWH + (hasPh && first ? PHOTO - headH : 0);
        if (cy + minH > CONTENT_BOT) { flowPage("Bendix parts / Refacciones Bendix"); }
        const avail = Math.floor((CONTENT_BOT - cy - headH) / ROWH);
        const rowsWant = Math.ceil((items.length - idx) / cols); const rows = Math.min(avail, rowsWant);
        const blockH = headH + Math.max(rows * ROWH, hasPh && first ? PHOTO - headH : 0);
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.2); T(fitText((g.type ? g.type + "  " : "") + g.name + (bxEs(g.name) && bxEs(g.name) !== g.name ? " / " + bxEs(g.name) : "") + (first ? "   (" + items.length + ")" : "   (cont. / continúa)"), W - 2 * M - left, "Helvetica-Bold", 8.2), M + left, cy);
        if (hasPh && first) { doc.rect(M, cy, PHOTO, PHOTO).fill("#ffffff"); doc.image(path.join(R, ph), M, cy, { fit: [PHOTO, PHOTO], align: "center", valign: "center" }); doc.rect(M, cy, PHOTO, PHOTO).lineWidth(0.5).strokeColor(LINE).stroke(); }
        const take = Math.min(rows * cols, items.length - idx);
        for (let k = 0; k < take; k++) { const it = items[idx + k]; const col = k % cols, row = Math.floor(k / cols); const x = M + left + col * CODEW, yy = cy + headH + row * ROWH; doc.font("Courier").fontSize(7.5).fillColor(INK); T(it.c.slice(0, 15), x, yy); const fl = /Remanufactured/i.test(it.m) ? "R" : /Original/i.test(it.m) ? "OE" : ""; if (fl) { doc.font("Helvetica-Bold").fontSize(6).fillColor(GRAY); T(fl, x + Math.min(it.c.length, 15) * 4.5 + 2, yy + 1); } }
        idx += take; cy += blockH + 5; first = false;
        if (idx < items.length) flowPage("Bendix parts / Refacciones Bendix");
      }
    }
  }

  // ---- helpers for the other sections
  const heading = (en, es, subEn, subEs) => { need(70, curTitle); doc.fillColor(INK).font("Helvetica-Bold").fontSize(18); T(en, M, cy); cy += 22; doc.fillColor(BLUE).fontSize(13); T(es, M, cy); cy += 20; doc.font("Helvetica").fontSize(9.5).fillColor(MUTE); T(subEn, M, cy, { width: W - 2 * M }); cy += 12; if (subEs) { T(subEs, M, cy, { width: W - 2 * M }); cy += 16; } };
  const band = (en, es) => { need(40, curTitle); doc.rect(M, cy, W - 2 * M, 15).fill(BLUE); doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9); T(fitText(bi(en, es), W - 2 * M - 12, "Helvetica-Bold", 9), M + 6, cy + 3.8); cy += 20; };
  const lines = (txt, font, size, color, x, w, lh) => { doc.font(font).fontSize(size).fillColor(color); const h = doc.heightOfString(txt, { width: w, lineGap: lh || 1 }); need(h + 2, curTitle); doc.text(txt, x, cy, { width: w, lineGap: lh || 1 }); cy += h + 3; };
  const dual = (en, es, x, w, size, enFont) => { const f1 = enFont || "Helvetica"; doc.font(f1).fontSize(size); const h1 = doc.heightOfString(en, { width: w, lineGap: 1 }); doc.font("Helvetica-Oblique").fontSize(size); const h2 = es ? doc.heightOfString(es, { width: w, lineGap: 1 }) : 0; need(h1 + h2 + 4, curTitle); doc.font(f1).fontSize(size).fillColor(INK).text(en, x, cy, { width: w, lineGap: 1 }); cy += h1; if (es) { doc.font("Helvetica-Oblique").fontSize(size).fillColor(MUTE).text(es, x, cy, { width: w, lineGap: 1 }); cy += h2; } cy += 4; };
  const G = OTHER.desk.groups;
  const titleBi = (t) => dual(t, I.trTitle(t), M, W - 2 * M, 8.5);

  // ---- Section 3: wheel ends
  flowPage("Wheel ends / Puntas de eje"); mark("sec_wheelend");
  heading("Wheel ends: bearings, seals, hubs", "Puntas de eje: rodamientos, retenes, mazas", "Timken, ConMet, SKF, National, Stemco and RevHD. Cone and cup numbers by set. Quote on request; we confirm fit.", "Timken, ConMet, SKF, National, Stemco y RevHD. Números de cono y copa por juego. Cotización bajo solicitud; confirmamos que la pieza le quede.");
  band("Wheel bearing sets (Timken, with ConMet PreSet)", "Juegos de rodamientos de rueda (Timken, con ConMet PreSet)");
  for (const g of G.filter((x) => x.cat === "bearing")) dual(g.title + "  -  " + g.members.map((m) => m.brand + " " + m.pn).join("  |  "), I.trTitle(g.title) ? I.trTitle(g.title) + "  -  " + g.members.map((m) => m.brand + " " + m.pn).join("  |  ") : "", M, W - 2 * M, 8.2);
  band("Wheel seals (Stemco, RevHD, SKF, National)", "Retenes de rueda (Stemco, RevHD, SKF, National)");
  for (const g of G.filter((x) => x.cat === "seal")) { dual(g.title, I.trTitle(g.title), M, W - 2 * M, 8.5, "Helvetica-Bold"); lines(g.members.map((m) => m.brand + " " + m.pn + (m.line ? " (" + m.line + ")" : "")).join("  |  "), "Helvetica", 8, INK, M + 8, W - 2 * M - 8, 1); }
  band("Hub caps and spindle nuts", "Tapas de maza y tuercas de husillo");
  for (const g of G.filter((x) => x.cat === "hubcap" || x.cat === "nut")) titleBi(g.title + "  -  " + g.members.map((m) => m.brand + " " + m.pn).join("  |  "));

  // ---- Section 4: friction
  flowPage("Friction / Fricción"); mark("sec_friction");
  heading("Friction: pads, shoes, drums, rotors", "Fricción: pastillas, zapatas, tambores, rotores", "Air disc pads with the caliper each one fits, shoes and lining, drums and rotors with cross-reference numbers.", "Pastillas de disco de aire con la mordaza a la que corresponde cada una, zapatas y balatas, tambores y rotores con números de referencia cruzada.");
  band("Air disc brake pads", "Pastillas de freno de disco de aire");
  for (const g of G.filter((x) => x.cat === "pad")) titleBi(g.title);
  band("Hydraulic brake pads", "Pastillas de freno hidráulico");
  for (const g of G.filter((x) => x.cat === "hydpad")) titleBi(g.title);
  band("Brake shoes, lining and drums", "Zapatas, balatas y tambores de freno");
  for (const s of OTHER.store.filter((x) => x.cat === "brakes")) lines(I.brandFix(s.brand) + "  " + s.pn + "  -  " + s.en + (ES.store[s.en] ? " / " + ES.store[s.en] : ""), "Helvetica", 8.5, INK, M, W - 2 * M, 1);
  for (const g of G.filter((x) => x.cat === "drum")) titleBi(g.title);
  band("Disc brake rotors and hub-rotor assemblies (with cross-reference numbers)", "Rotores de freno de disco y conjuntos maza-rotor (con referencia cruzada)");
  for (const r of OTHER.inv.filter((x) => x.cat === "rotor")) lines(r.pn + "  -  " + bi(I.enInv(r.d), I.esInv(r.d)) + (r.x ? "  -  cross-reference / referencia cruzada: " + r.x : ""), "Helvetica", 8, INK, M, W - 2 * M, 1);

  // ---- Section 5: fittings
  flowPage("Air line fittings / Conexiones de aire"); mark("sec_fittings");
  heading("Air line fittings", "Conexiones de línea de aire", "DOT push-connect, DOT compression, brass, Velvac and Automann. Sizes in inches. Quote on request.", "Push-connect DOT, compresión DOT, latón, Velvac y Automann. Medidas en pulgadas. Cotización bajo solicitud.");
  const FC = [["push", "DOT push-connect fittings", "Conexiones push-connect DOT"], ["comp", "DOT compression and bulkhead fittings", "Conexiones DOT de compresión y mampara"], ["velvac", "Velvac push-lock and compression", "Velvac push-lock y compresión"], ["brass", "Brass compression fittings", "Conexiones de compresión de latón"], ["automann", "Automann PLC and DOT fittings", "Conexiones Automann PLC y DOT"]];
  for (const [c, en, es] of FC) {
    band(en, es);
    const bySeries = {}; for (const i of OTHER.inv.filter((x) => x.cat === c)) (bySeries[i.d] = bySeries[i.d] || []).push(i);
    for (const [d, arr] of Object.entries(bySeries)) {
      lines(bi(I.enInv(d), I.esInv(d)) + "  (" + arr.length + ")", "Helvetica-Bold", 8.3, BLUE, M, W - 2 * M, 1);
      lines(arr.map((i) => i.pn + (i.x ? " [" + i.x.replace(" pulg", " in") + "]" : "")).join("   "), "Courier", 7.5, INK, M + 8, W - 2 * M - 8, 1.5);
    }
  }

  // ---- Section 6: springs
  flowPage("Trailer springs / Muelles de remolque"); mark("sec_springs");
  heading("Trailer leaf springs", "Muelles (ballestas) de remolque", "Triangle Spring, Automann, Dexter and cross references. DE = double eye, SL = slipper. Lengths and widths in inches. Quote on request.", "Triangle Spring, Automann, Dexter y referencias cruzadas. DE = doble ojo, SL = deslizante (slipper). Largos y anchos en pulgadas. Cotización bajo solicitud.");
  const style = (s) => (s === "DE" ? "double eye / doble ojo" : s === "SL" ? "slipper / deslizante" : s);
  for (const s of OTHER.desk.springs) lines(s.brand + "  " + s.pn + "  -  " + style(s.style) + (s.len ? ", " + s.len + " in" : "") + (s.w ? ", " + s.w + " in wide / ancho" : "") + (s.leaves ? ", " + s.leaves + " leaf / hojas" : "") + (s.cap && s.cap !== "measure" ? ", capacity / capacidad " + s.cap + " lb" : "") + (s.axle && s.axle !== "measure" ? ", axle / eje " + s.axle : "") + ((s.xref || []).length ? "  -  cross-reference / referencia cruzada: " + s.xref.join(", ") : ""), "Helvetica", 8.3, INK, M, W - 2 * M, 1);
  band("Cross-reference: common trailer spring numbers", "Referencia cruzada: números comunes de muelles de remolque");
  for (const x of OTHER.xrefs) lines(x.pn + "  -  " + style(x.style) + ", " + x.len + " in, " + x.leaves + " leaf / hojas, " + x.cap + " lb  -  also / también: " + (x.xref || []).join(", "), "Helvetica", 8.3, INK, M, W - 2 * M, 1);

  // ---- Section 7: store list
  flowPage("Shop stock list / Lista del taller"); mark("sec_store");
  heading("Shop stock list", "Lista de refacciones del taller", "Parts and brands we handle through the shop: brakes, air, ABS, clutch, wheel end, steering, suspension, coupling, lighting, filters and hardware.", "Piezas y marcas que manejamos en el taller: frenos, aire, ABS, clutch, puntas de eje, dirección, suspensión, acoplamiento, iluminación, filtros y herrajes.");
  const SC = { brakes: ["Brakes", "Frenos"], air: ["Air brake", "Freno de aire"], abs: ["ABS", "ABS"], clutch: ["Clutch", "Clutch"], wheel: ["Wheel end", "Punta de eje"], steer: ["Steering", "Dirección"], susp: ["Suspension", "Suspensión"], couple: ["Coupling", "Acoplamiento"], light: ["Lighting", "Iluminación"], filter: ["Filtration", "Filtración"], hardware: ["Hardware", "Herrajes"] };
  for (const [k, lab] of Object.entries(SC)) { const arr = OTHER.store.filter((x) => x.cat === k); if (!arr.length) continue; band(lab[0], lab[1]); for (const s of arr) lines(I.brandFix(s.brand) + "  " + s.pn + "  -  " + s.en + (ES.store[s.en] ? " / " + ES.store[s.en] : ""), "Helvetica", 8.5, INK, M, W - 2 * M, 1); }

  // ---- back page
  newPage("Request a quote / Solicite cotización"); mark("sec_back");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text("Request a quote", M, 80);
  doc.fillColor(BLUE).fontSize(16).text("Solicite su cotización", M, 108);
  doc.fillColor(INK).font("Helvetica").fontSize(11.5).text("Copy this into an email to saul@mexausafg.com and fill in the blanks.", M, 138, { width: W - 2 * M });
  doc.fillColor(MUTE).text("Copie esto en un correo a saul@mexausafg.com y llene los espacios.", M, 156, { width: W - 2 * M });
  doc.rect(M, 190, W - 2 * M, 340).fill(TINT);
  [["Company name:", "Empresa:"], ["Contact name and phone:", "Nombre de contacto y teléfono:"], ["Delivery city and state:", "Ciudad y estado de entrega:"], ["Truck or trailer make, model, year:", "Marca, modelo y año del camión o remolque:"], ["VIN (if you have it):", "VIN (si lo tiene):"], ["Part numbers and quantities:", "Números de parte y cantidades:"]].forEach((t, i) => { doc.fillColor(INK).font("Helvetica-Bold").fontSize(11.5); T(t[0] + "  /  " + t[1], M + 20, 210 + i * 52); doc.moveTo(M + 20, 210 + i * 52 + 33).lineTo(W - M - 20, 210 + i * 52 + 33).strokeColor("#b8c4ce").lineWidth(0.8).stroke(); });
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(20).text("saul@mexausafg.com", M, 570);
  doc.fillColor(INK).font("Helvetica").fontSize(14).text("mexausafg.com", M, 602);
  doc.fillColor(MUTE).fontSize(10.5).text("Mexausa Food Group, Inc.", M, 650);

  // ---- footers
  const total = doc.bufferedPageRange().count;
  for (let i = 0; i < total; i++) { doc.switchToPage(i); doc.moveTo(M, H - 44).lineTo(W - M, H - 44).strokeColor(LINE).lineWidth(0.8).stroke(); doc.fillColor(MUTE).font("Helvetica").fontSize(8.5); doc.text("Request a quote / Solicite cotización: saul@mexausafg.com   |   mexausafg.com", M, H - 34, { lineBreak: false }); doc.text("Page / Página " + (i + 1) + " of / de " + total, 0, H - 34, { width: W - M, align: "right", lineBreak: false }); }
  doc.flushPages(); doc.end();
  return new Promise((res) => ws.on("finish", () => res({ marks, total })));
}

(async () => {
  const tmp = OUT + ".pass1";
  const p1 = await run({}, tmp); fs.unlinkSync(tmp);
  const p2 = await run(p1.marks, OUT);
  console.log("pages", p2.total, "bendix parts", TOTAL_BX, "families", names.length, "photos on", Object.keys(PH).length, "groups");
})();

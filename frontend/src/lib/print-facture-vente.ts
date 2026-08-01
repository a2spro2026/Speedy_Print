import { loadClients } from "@/lib/clients";
import {
  formatDateFR,
  normalizeBonCmdNumero,
  type FactureVente,
} from "@/lib/factures-vente";
import { formatMoney } from "@/lib/money";
import { montantEnLettres } from "@/lib/montant-en-lettres";
import { printHtmlDocument } from "@/lib/print-html";
import { loadReglementsClient } from "@/lib/reglements-client";

/** Accent facture (totaux) — hors conception papier à en-tête. */
const ACCENT = "#64748B";

/** Marge basse de sécurité (px) sur les feuilles intermédiaires. */
const SUITE_RESERVE = 28;

/** Marge de sécurité (px) retirée de la zone utile, contre les arrondis. */
const SAFETY_PX = 10;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcMontants(f: FactureVente): {
  ht: number;
  tva: number;
  ttc: number;
  tvaLabel: string;
} {
  let ht = 0;
  let tva = 0;
  for (const l of f.lignes ?? []) {
    const qte = Number(l.qte) || 0;
    const prixU = Number(l.prixU) || 0;
    const remise = Number(l.remise) || 0;
    const tvaPct = f.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
    const brut = qte * prixU;
    const apresRemise = brut * (1 - Math.min(Math.max(remise, 0), 100) / 100);
    ht += apresRemise;
    tva += apresRemise * (Math.max(tvaPct, 0) / 100);
  }
  ht = round2(ht);
  tva = round2(tva);

  const rates = [
    ...new Set(
      (f.lignes ?? [])
        .map((l) => (f.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0))
        .filter((r) => r > 0)
    ),
  ];
  const tvaLabel =
    f.typeFacture === "Exonéré"
      ? "TVA (exonéré)"
      : rates.length === 1
        ? `TVA (${rates[0]}%)`
        : "TVA";

  const computed =
    f.typeFacture === "HT" || f.typeFacture === "Exonéré"
      ? ht
      : round2(ht + tva);

  return {
    ht,
    tva,
    ttc: Number(f.montantFacture) || computed,
    tvaLabel,
  };
}

function clientInfo(f: FactureVente) {
  const c = loadClients().find((x) => x.id === f.clientId);
  return {
    nom: f.nomClient || "—",
    contact: c?.contact || "",
    ville: c?.ville || "",
    ice: f.ice || c?.ice || "",
    id: f.clientId || "",
  };
}

function paymentInfo(f: FactureVente): {
  mode: string;
  numero: string;
  nomTire: string;
  dateEncaisse: string;
} {
  const regs = loadReglementsClient()
    .filter(
      (r) =>
        r.factureId === f.id ||
        (r.refFacture && r.refFacture === f.numeroFacture)
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const r = regs[0];
  if (r) {
    return {
      mode: r.modeReglement || f.typeReglement || "—",
      numero: r.numeroRegl || "—",
      nomTire: r.nomTire || "—",
      dateEncaisse: r.dateEncaisse ? formatDateFR(r.dateEncaisse) : "—",
    };
  }
  return {
    mode: f.typeReglement || "—",
    numero: "—",
    nomTire: "—",
    dateEncaisse: f.echeance ? formatDateFR(f.echeance) : "—",
  };
}

function ligneRowHtml(
  f: FactureVente,
  l: NonNullable<FactureVente["lignes"]>[number],
  globalIndex: number
): string {
  const qte = Number(l.qte) || 0;
  const prixU = Number(l.prixU) || 0;
  const remise = Number(l.remise) || 0;
  const tva = f.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
  const brut = qte * prixU;
  const htLigne = round2(brut * (1 - Math.min(Math.max(remise, 0), 100) / 100));
  return `<tr class="${globalIndex % 2 ? "alt" : ""}">
        <td class="desig">
          ${escapeHtml(l.designation || "—")}
          ${remise > 0 ? `<div class="sub">Remise ${remise}%</div>` : ""}
        </td>
        <td class="unit">${escapeHtml(l.unite || "U")}</td>
        <td class="num">${qte}</td>
        <td class="num">${formatMoney(prixU)}</td>
        <td class="num">${tva}%</td>
        <td class="num strong">${formatMoney(htLigne)}</td>
      </tr>`;
}

function lignesHtml(
  f: FactureVente,
  lignes: NonNullable<FactureVente["lignes"]>,
  startIndex: number
): string {
  return lignes
    .map((l, i) => ligneRowHtml(f, l, startIndex + i))
    .join("");
}

function tableHtml(bodyHtml: string): string {
  return `<table class="lines">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="unit">U</th>
          <th class="num">Qté</th>
          <th class="num">Prix/U</th>
          <th class="num">TVA</th>
          <th class="num">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>`;
}

function headBlockHtml(f: FactureVente): string {
  const client = clientInfo(f);
  const bc = normalizeBonCmdNumero(f.bonCmdNumero || "");
  return `<div class="head-block">
      <div class="info-row">
        <div class="box">
          <h3>Client</h3>
          <div class="name">${escapeHtml(client.nom)}</div>
          ${client.contact ? `<div class="line">${escapeHtml(client.contact)}</div>` : ""}
          ${client.ville ? `<div class="line">${escapeHtml(client.ville)}</div>` : ""}
          ${client.ice ? `<div class="line">ICE : <b>${escapeHtml(client.ice)}</b></div>` : ""}
        </div>
        <div class="box">
          <h3 class="facture-title">Facture</h3>
          <div class="line num-facture">N° : <b>${escapeHtml(f.numeroFacture)}</b></div>
          ${bc ? `<div class="line">Bon de commande N° : <b>${escapeHtml(bc)}</b></div>` : ""}
          <div class="line">Date d'émission : <b>${formatDateFR(f.date)}</b></div>
          <div class="line">Règlement : <b>${escapeHtml(f.typeReglement)}</b></div>
        </div>
      </div>
      <div class="doc-title">Détail Facture</div>
    </div>`;
}

function suiteBlockHtml(f: FactureVente): string {
  return `<div class="head-block suite">
      <div class="doc-title">Facture N° ${escapeHtml(f.numeroFacture)} — Détail Facture</div>
    </div>`;
}

function footBlockHtml(f: FactureVente): string {
  const { ht, tva, ttc, tvaLabel } = calcMontants(f);
  const pay = paymentInfo(f);
  const lettres = montantEnLettres(ttc);
  return `<div class="foot-block">
      <div class="bottom-grid">
        <div class="payment-note">
          <strong>Informations de paiement</strong>
          <div class="pay-line"><span class="pay-lab">Mode :</span> <b>${escapeHtml(pay.mode)}</b></div>
          <div class="pay-line"><span class="pay-lab">N° :</span> <b>${escapeHtml(pay.numero)}</b></div>
          <div class="pay-line"><span class="pay-lab">Nom Tiré :</span> <b>${escapeHtml(pay.nomTire)}</b></div>
          <div class="pay-line"><span class="pay-lab">Date Encaiss :</span> <b>${escapeHtml(pay.dateEncaisse)}</b></div>
        </div>
        <div class="totals-wrap">
          <table class="totals">
            <tr><td>Total HT</td><td>${formatMoney(ht)}</td></tr>
            <tr><td>${escapeHtml(tvaLabel)}</td><td>${formatMoney(tva)}</td></tr>
            <tr class="spacer"><td colspan="2"></td></tr>
            <tr class="ttc"><td>Total TTC</td><td>${formatMoney(ttc)}</td></tr>
          </table>
        </div>
      </div>
      <div class="montant-lettres">
        <span class="lab">Arrêté la présente facture à la somme de</span>
        <span class="val">${escapeHtml(lettres)}</span>
      </div>
    </div>`;
}

function factureCss(pageBg: string): string {
  return `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    ${pageBg}
  }
  /* Saut AVANT chaque feuille suivante : évite la feuille blanche
     que provoque « page-break-after » sur un bloc de 297mm pile. */
  .page + .page {
    page-break-before: always;
    break-before: page;
  }
  /* Zone centrale : sous l'en-tête, au-dessus du pied — conception intacte */
  .content {
    position: absolute;
    top: 55mm;
    left: 14mm;
    right: 14mm;
    bottom: 52mm;
    overflow: hidden;
  }

  .info-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 18px;
    margin-bottom: 12px;
  }
  .box {
    border: 1px solid #e5e5e5;
    border-left: 4px solid ${ACCENT};
    padding: 10px 12px;
    background: rgba(255,255,255,0.88);
  }
  .box h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${ACCENT};
  }
  .box h3.facture-title {
    font-size: 18px;
  }
  .box .name {
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .box .line { margin: 2px 0; color: #333; }
  .box .line b { color: #111; }
  .box .line.num-facture {
    margin-top: 4px;
    font-size: 15px;
  }
  .box .line.num-facture b {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .doc-title {
    text-align: left;
    font-size: 16px;
    font-weight: 800;
    margin: 12px 0 10px;
    color: #111;
  }
  .head-block.suite .doc-title { font-size: 14px; }

  table.lines {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255,255,255,0.9);
  }
  table.lines thead th {
    background: #1a1a1a;
    color: #fff;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 5px 5px;
    text-align: center;
    vertical-align: middle;
  }
  table.lines tbody td {
    padding: 5px;
    font-size: 11.3px;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: middle;
    text-align: center;
    line-height: 1.15;
  }
  table.lines tr.alt td { background: #faf7f4; }
  td.desig { text-align: center; }
  /* La remise reste compacte sous la désignation. */
  td.desig .sub {
    color: #777;
    font-size: 8.5px;
    margin-top: 1px;
  }
  td.unit, th.unit {
    width: 30px;
    text-align: center;
    white-space: nowrap;
    font-weight: 700;
  }
  td.num, th.num { white-space: nowrap; }
  td.strong { font-weight: 800; }

  .foot-block { margin-top: 28px; }
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 16px;
    align-items: start;
  }
  .payment-note {
    font-size: 11px;
    color: #333;
    line-height: 1.55;
  }
  .payment-note strong {
    color: ${ACCENT};
    display: block;
    margin-bottom: 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .payment-note .pay-line { margin: 3px 0; }
  .payment-note .pay-lab {
    display: inline-block;
    min-width: 88px;
    color: #555;
  }

  .totals-wrap {
    margin-top: 18px;
  }
  .totals {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }
  .totals td {
    padding: 5px 8px;
    font-size: 11px;
    border-bottom: 1px solid #eee;
  }
  .totals td:last-child {
    text-align: right;
    font-weight: 700;
    white-space: nowrap;
  }
  .totals tr.spacer td {
    border: none;
    padding: 10px 0 0;
    height: 12px;
    background: transparent;
  }
  .totals tr.ttc td {
    background: #111;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    border: none;
    padding: 10px 8px;
  }

  .montant-lettres {
    margin-top: 14px;
    padding: 8px 10px;
    border: 1px solid #e5e5e5;
    background: rgba(255,255,255,0.92);
    font-size: 11px;
    line-height: 1.45;
    color: #222;
  }
  .montant-lettres .lab {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${ACCENT};
    font-weight: 700;
    margin-bottom: 4px;
  }
  .montant-lettres .val {
    font-weight: 600;
    font-style: italic;
  }

  @media print {
    /* Hauteur très légèrement réduite : absorbe les arrondis du moteur
       d'impression, sinon chaque feuille déborde de 1px sur la suivante. */
    .page {
      width: 210mm;
      height: 296.6mm;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }`;
}

export type PrintFactureOptions = {
  /** true = image papier à en-tête telle quelle ; false = zones vides (papier déjà imprimé). */
  withLetterhead?: boolean;
};

function pageBackground(withLetterhead: boolean): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const letterUrl = `${origin}/lettre-speedyprint.png`;
  return withLetterhead
    ? `background: #fff url("${escapeHtml(letterUrl)}") center top / 210mm 297mm no-repeat;`
    : "background: #fff;";
}

/** Mesures (px) de la feuille, relevées dans le navigateur. */
type Metrics = {
  contentH: number;
  headH: number;
  suiteH: number;
  theadH: number;
  footH: number;
  rowH: number[];
};

/**
 * Répartit les lignes sur les feuilles d'après les hauteurs réelles.
 * Garantit qu'aucun article n'est coupé par la zone `overflow: hidden`.
 */
function paginate(m: Metrics): number[] {
  const total = m.rowH.length;
  if (total === 0) return [0];

  const pages: number[][] = [];
  let i = 0;

  while (i < total) {
    const isFirst = pages.length === 0;
    const cap =
      m.contentH -
      (isFirst ? m.headH : m.suiteH) -
      m.theadH -
      SUITE_RESERVE;
    let used = 0;
    let count = 0;
    // Remplit la feuille jusqu'au pied de page (pas de plafond fixe).
    while (i + count < total && used + m.rowH[i + count] <= cap) {
      used += m.rowH[i + count];
      count += 1;
    }
    // Une ligne trop haute pour une feuille vide : on la place quand même.
    if (count === 0) count = 1;
    pages.push(Array.from({ length: count }, (_, k) => i + k));
    i += count;
  }

  // La dernière feuille doit aussi accueillir les totaux + montant en lettres.
  for (let guard = 0; guard < 50; guard += 1) {
    const last = pages.length - 1;
    const isFirst = last === 0;
    const cap =
      m.contentH - (isFirst ? m.headH : m.suiteH) - m.theadH - m.footH;
    const rows = pages[last];
    const used = rows.reduce((sum, idx) => sum + m.rowH[idx], 0);
    if (used <= cap || rows.length === 0) break;

    const carried: number[] = [];
    let remaining = used;
    while (rows.length > 0 && remaining > cap) {
      const moved = rows.pop() as number;
      remaining -= m.rowH[moved];
      carried.unshift(moved);
    }
    if (rows.length === 0) {
      // Rien ne tenait : on garde la feuille telle quelle pour éviter une boucle.
      pages[last] = carried;
      break;
    }
    pages.push(carried);
  }

  return pages.map((p) => p.length);
}

/**
 * Répartition de secours si la mesure navigateur n'est pas disponible.
 * Capacités larges (remplissage jusqu'au pied) — la mesure réelle prime.
 */
function fallbackChunks(count: number): number[] {
  if (count === 0) return [0];
  const FIRST = 12;
  const MID = 18;
  const LAST = 10;
  if (count <= LAST) return [count];

  const sizes: number[] = [];
  let rest = count;
  sizes.push(Math.min(FIRST, rest));
  rest -= sizes[0];
  while (rest > LAST) {
    const take = Math.min(MID, rest);
    sizes.push(take);
    rest -= take;
  }
  if (rest > 0) sizes.push(rest);
  return sizes;
}

/**
 * Impression facture client.
 * Conception en-tête / pied = image lettre-speedyprint.png (inchangée).
 * Seul le contenu facture est injecté dans la zone centrale.
 */
export function buildFactureVentePrintHtml(
  f: FactureVente,
  options: PrintFactureOptions = {},
  chunkSizes?: number[]
): string {
  const withLetterhead = options.withLetterhead !== false;
  const pageBg = pageBackground(withLetterhead);
  const allLignes = f.lignes ?? [];
  const sizes =
    chunkSizes && chunkSizes.length > 0
      ? chunkSizes
      : fallbackChunks(allLignes.length);

  let offset = 0;
  const pagesHtml = sizes
    .map((size, pageIndex) => {
      const isLast = pageIndex === sizes.length - 1;
      const chunk = allLignes.slice(offset, offset + size);
      const startIndex = offset;
      offset += size;

      const head =
        pageIndex === 0
          ? headBlockHtml(f)
          : suiteBlockHtml(f);
      const foot = isLast
        ? footBlockHtml(f)
        : "";

      return `<div class="page">
  <div class="content">
    ${head}
    ${tableHtml(lignesHtml(f, chunk, startIndex))}
    ${foot}
  </div>
</div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Facture ${escapeHtml(f.numeroFacture)}</title>
<style>${factureCss(pageBg)}
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
}

/** Document de mesure : une feuille contenant tous les blocs et toutes les lignes. */
function buildMeasureHtml(f: FactureVente): string {
  const allLignes = f.lignes ?? [];
  const rows = allLignes
    .map((l, i) => ligneRowHtml(f, l, i))
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<style>${factureCss("background: #fff;")}
  /* Mesure : les zones doivent pouvoir déborder sans être rognées */
  .page { height: auto; overflow: visible; }
  .content { overflow: visible; bottom: auto; height: auto; }
</style>
</head>
<body>
<div class="page" id="m-page">
  <div class="content" id="m-content">
    ${headBlockHtml(f)}
    ${tableHtml(rows)}
    ${footBlockHtml(f)}
  </div>
</div>
<div class="page" id="m-page-suite">
  <div class="content" id="m-suite">
    ${suiteBlockHtml(f)}
    ${tableHtml("")}
  </div>
</div>
</body>
</html>`;
}

async function measureFacture(f: FactureVente): Promise<Metrics | null> {
  if (typeof document === "undefined") return null;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;height:400mm;overflow:hidden;pointer-events:none;opacity:0;";
  document.body.appendChild(host);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:210mm;height:1200mm;border:0;";
    host.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return null;

    doc.open();
    doc.write(buildMeasureHtml(f));
    doc.close();

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (doc.readyState === "complete") done();
      else win.addEventListener("load", done, { once: true });
      setTimeout(done, 600);
    });

    const content = doc.getElementById("m-content");
    const table = doc.querySelector("#m-content table.lines") as HTMLElement | null;
    const thead = doc.querySelector("#m-content table.lines thead") as HTMLElement | null;
    const foot = doc.querySelector("#m-content .foot-block") as HTMLElement | null;
    // offsetTop du tableau = hauteur réelle du bloc « suite », marges comprises
    const suiteTable = doc.querySelector(
      "#m-suite table.lines"
    ) as HTMLElement | null;
    const rows = Array.from(
      doc.querySelectorAll("#m-content table.lines tbody tr")
    ) as HTMLElement[];

    if (!content || !table || !thead) return null;

    // Hauteur utile réelle : 297mm − 55mm (en-tête) − 52mm (pied)
    const mmToPx = (mm: number) => (mm * (content.clientWidth || 1)) / 182;
    const contentH = Math.round(mmToPx(190)) - SAFETY_PX;

    const headH = Math.ceil(table.offsetTop);
    const theadH = Math.ceil(thead.getBoundingClientRect().height);
    const footH = foot
      ? Math.ceil(foot.getBoundingClientRect().height) + 28
      : 220;
    const suiteH = suiteTable ? Math.ceil(suiteTable.offsetTop) : 44;
    const rowH = rows.map((r) =>
      Math.max(1, Math.ceil(r.getBoundingClientRect().height))
    );

    if (contentH <= 0 || rowH.length !== (f.lignes ?? []).length) return null;

    return { contentH, headH, suiteH, theadH, footH, rowH };
  } catch {
    return null;
  } finally {
    host.remove();
  }
}

/** HTML final paginé d'après les mesures navigateur. */
async function buildPaginatedHtml(
  f: FactureVente,
  options: PrintFactureOptions
): Promise<string> {
  const metrics = await measureFacture(f);
  const sizes = metrics ? paginate(metrics) : undefined;
  return buildFactureVentePrintHtml(f, options, sizes);
}

/**
 * Impression facture client (iframe, sans popup bloquée).
 * Toutes les lignes sont imprimées, réparties sur autant de feuilles A4 que nécessaire.
 */
export async function printFactureVente(
  f: FactureVente,
  options: PrintFactureOptions = {}
): Promise<boolean> {
  const html = await buildPaginatedHtml(f, options);
  return printHtmlDocument(html);
}

function safeFactureFileName(f: FactureVente): string {
  return (f.numeroFacture || f.id || "facture")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
}

/** Télécharge la facture en PDF (A4 multi-pages, tous les articles). */
export async function downloadFactureVente(
  f: FactureVente,
  options: PrintFactureOptions = {}
): Promise<boolean> {
  if (typeof document === "undefined") return false;

  const html = await buildPaginatedHtml(f, options);
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;overflow:hidden;pointer-events:none;opacity:0;";
  document.body.appendChild(host);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:210mm;height:297mm;border:0;";
    host.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return false;

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (doc.readyState === "complete") done();
      else win.addEventListener("load", done, { once: true });
      setTimeout(done, 800);
    });

    const images = Array.from(doc.images || []);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }
          })
      )
    );
    // Laisse le rendu CSS / fond se stabiliser
    await new Promise((r) => setTimeout(r, 200));

    const pages = Array.from(doc.querySelectorAll(".page")) as HTMLElement[];
    if (pages.length === 0) return false;

    iframe.style.height = `${pages.length * 297}mm`;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: page.offsetWidth,
        height: page.offsetHeight,
        windowWidth: page.offsetWidth,
        windowHeight: page.offsetHeight,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    pdf.save(`${safeFactureFileName(f)}.pdf`);
    return true;
  } catch {
    return false;
  } finally {
    host.remove();
  }
}

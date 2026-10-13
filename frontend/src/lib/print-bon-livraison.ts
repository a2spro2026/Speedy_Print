import { loadClients } from "@/lib/clients";
import { formatDateFR } from "@/lib/devis";
import type { BonLivraison } from "@/lib/bons-livraison";
import { formatMoney } from "@/lib/money";
import { downloadHtmlAsPdf } from "@/lib/download-pdf";
import { printHtmlDocument } from "@/lib/print-html";

const ACCENT = "#0F766E";

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

function calcMontants(b: BonLivraison) {
  let ht = 0;
  let tva = 0;
  for (const l of b.lignes ?? []) {
    const qte = Number(l.qte) || 0;
    const prixU = Number(l.prixU) || 0;
    const remise = Number(l.remise) || 0;
    const tvaPct = b.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
    const apresRemise =
      qte * prixU * (1 - Math.min(Math.max(remise, 0), 100) / 100);
    ht += apresRemise;
    tva += apresRemise * (Math.max(tvaPct, 0) / 100);
  }
  ht = round2(ht);
  tva = round2(tva);
  const computed =
    b.typeFacture === "HT" || b.typeFacture === "Exonéré"
      ? ht
      : round2(ht + tva);
  return { ht, tva, ttc: Number(b.montantFacture) || computed };
}

function clientInfo(b: BonLivraison) {
  const c = loadClients().find((x) => x.id === b.clientId);
  return {
    nom: b.nomClient || "—",
    contact: c?.contact || "",
    ville: c?.ville || "",
    ice: b.ice || c?.ice || "",
    id: b.clientId || "",
  };
}

function lignesHtml(b: BonLivraison, withPrices: boolean): string {
  return (b.lignes ?? [])
    .map((l, i) => {
      const qte = Number(l.qte) || 0;
      const prixU = Number(l.prixU) || 0;
      const remise = Number(l.remise) || 0;
      const tva = b.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
      const htLigne = round2(
        qte * prixU * (1 - Math.min(Math.max(remise, 0), 100) / 100)
      );
      const prixCells = withPrices
        ? `<td class="num">${formatMoney(prixU)}</td>
        <td class="num">${tva}%</td>
        <td class="num strong">${formatMoney(htLigne)}</td>`
        : "";
      return `<tr class="${i % 2 ? "alt" : ""}">
        <td class="c">${i + 1}</td>
        <td class="ref">${escapeHtml(l.ref || "—")}</td>
        <td class="desig">${escapeHtml(l.designation || "")}</td>
        <td class="num">${escapeHtml(l.unite || "U")}</td>
        <td class="num strong">${qte}</td>
        ${prixCells}
      </tr>`;
    })
    .join("");
}

export type PrintBonLivraisonOptions = {
  /** true = image papier à en-tête ; false = zones vides (papier déjà imprimé). */
  withLetterhead?: boolean;
  /** false = BL classique, quantités seulement. */
  withPrices?: boolean;
};

export function buildBonLivraisonPrintHtml(
  b: BonLivraison,
  options: PrintBonLivraisonOptions = {}
): string {
  const withLetterhead = options.withLetterhead !== false;
  const withPrices = options.withPrices !== false;
  const { ht, tva, ttc } = calcMontants(b);
  const client = clientInfo(b);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const letterUrl = `${origin}/lettre-speedyprint.png`;
  const pageBg = withLetterhead
    ? `background: #fff url("${escapeHtml(letterUrl)}") center top / 210mm 297mm no-repeat;`
    : "background: #fff;";

  const prixHead = withPrices
    ? `<th class="num">Prix/U</th>
          <th class="num">TVA</th>
          <th class="num">Montant HT</th>`
    : "";

  const totalsHtml = withPrices
    ? `<table class="totals">
        <tr><td>Total HT</td><td>${formatMoney(ht)}</td></tr>
        <tr><td>TVA</td><td>${formatMoney(tva)}</td></tr>
        <tr class="ttc"><td>Total TTC</td><td>${formatMoney(ttc)}</td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Bon de livraison ${escapeHtml(b.numeroBL)}</title>
<style>
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
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${ACCENT};
  }
  .box .name { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
  .box .line { margin: 2px 0; color: #333; }
  .box .line b { color: #111; }
  .doc-title { font-size: 16px; font-weight: 800; margin: 4px 0 10px; }
  table.lines {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255,255,255,0.9);
  }
  table.lines thead th {
    background: #1a1a1a;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 8px 6px;
    text-align: center;
  }
  table.lines tbody td {
    padding: 7px 6px;
    border-bottom: 1px solid #e8e8e8;
    text-align: center;
  }
  table.lines tr.alt td { background: #f4faf9; }
  td.c { width: 28px; }
  td.ref { width: 14%; font-family: Consolas, monospace; font-size: 10px; }
  td.num { white-space: nowrap; }
  td.strong { font-weight: 800; }
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 16px;
    margin-top: 12px;
    align-items: start;
  }
  .totals { width: 100%; border-collapse: collapse; background: #fff; }
  .totals td { padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #eee; }
  .totals td:last-child { text-align: right; font-weight: 700; white-space: nowrap; }
  .totals tr.ttc td {
    background: ${ACCENT};
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    border: none;
    padding: 8px;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 18px;
  }
  .sign {
    border: 1px dashed #bbb;
    height: 26mm;
    padding: 8px 10px;
    font-size: 10px;
    font-weight: 700;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>
<div class="page">
  <div class="content">
    <div class="info-row">
      <div class="box">
        <h3>Client</h3>
        <div class="name">${escapeHtml(client.nom)}</div>
        ${client.id ? `<div class="line">ID : <b>${escapeHtml(client.id)}</b></div>` : ""}
        ${client.contact ? `<div class="line">${escapeHtml(client.contact)}</div>` : ""}
        ${client.ville ? `<div class="line">${escapeHtml(client.ville)}</div>` : ""}
        ${client.ice ? `<div class="line">ICE : <b>${escapeHtml(client.ice)}</b></div>` : ""}
      </div>
      <div class="box">
        <h3>Bon de livraison</h3>
        <div class="line">N° : <b>${escapeHtml(b.numeroBL)}</b></div>
        <div class="line">Date de livraison : <b>${formatDateFR(b.date)}</b></div>
      </div>
    </div>

    <div class="doc-title">Détail de la livraison</div>

    <table class="lines">
      <thead>
        <tr>
          <th class="c">N°</th>
          <th>Réf</th>
          <th>Désignation</th>
          <th class="num">Unité</th>
          <th class="num">Qté</th>
          ${prixHead}
        </tr>
      </thead>
      <tbody>
        ${lignesHtml(b, withPrices)}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div></div>
      ${totalsHtml}
    </div>

    <div class="signatures">
      <div class="sign">Livré par</div>
      <div class="sign">Reçu par — cachet et signature client</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function printBonLivraison(
  b: BonLivraison,
  options: PrintBonLivraisonOptions = {}
): boolean {
  return printHtmlDocument(buildBonLivraisonPrintHtml(b, options));
}

/** Télécharge le bon de livraison en PDF A4. */
export function downloadBonLivraison(
  b: BonLivraison,
  options: PrintBonLivraisonOptions = {}
): Promise<boolean> {
  return downloadHtmlAsPdf(
    buildBonLivraisonPrintHtml(b, options),
    b.numeroBL || b.id || "bon-livraison"
  );
}

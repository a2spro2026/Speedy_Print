import { loadClients } from "@/lib/clients";
import { formatDateFR, type Devis } from "@/lib/devis";
import { formatMoney } from "@/lib/money";
import { printHtmlDocument } from "@/lib/print-html";

/** Accent devis (totaux) — même famille que facture client. */
const ACCENT = "#64748B";

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

function calcMontants(d: Devis): {
  ht: number;
  tva: number;
  ttc: number;
  tvaLabel: string;
} {
  let ht = 0;
  let tva = 0;
  for (const l of d.lignes ?? []) {
    const qte = Number(l.qte) || 0;
    const prixU = Number(l.prixU) || 0;
    const remise = Number(l.remise) || 0;
    const tvaPct = d.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
    const brut = qte * prixU;
    const apresRemise = brut * (1 - Math.min(Math.max(remise, 0), 100) / 100);
    ht += apresRemise;
    tva += apresRemise * (Math.max(tvaPct, 0) / 100);
  }
  ht = round2(ht);
  tva = round2(tva);

  const rates = [
    ...new Set(
      (d.lignes ?? [])
        .map((l) => (d.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0))
        .filter((r) => r > 0)
    ),
  ];
  const tvaLabel =
    d.typeFacture === "Exonéré"
      ? "TVA (exonéré)"
      : rates.length === 1
        ? `TVA (${rates[0]}%)`
        : "TVA";

  const computed =
    d.typeFacture === "HT" || d.typeFacture === "Exonéré"
      ? ht
      : round2(ht + tva);

  return {
    ht,
    tva,
    ttc: Number(d.montantFacture) || computed,
    tvaLabel,
  };
}

function clientInfo(d: Devis) {
  const c = loadClients().find((x) => x.id === d.clientId);
  return {
    nom: d.nomClient || "—",
    contact: c?.contact || "",
    ville: c?.ville || "",
    ice: d.ice || c?.ice || "",
    id: d.clientId || "",
  };
}

function lignesHtml(d: Devis): string {
  return (d.lignes ?? [])
    .map((l, i) => {
      const qte = Number(l.qte) || 0;
      const prixU = Number(l.prixU) || 0;
      const remise = Number(l.remise) || 0;
      const tva = d.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
      const brut = qte * prixU;
      const htLigne = round2(
        brut * (1 - Math.min(Math.max(remise, 0), 100) / 100)
      );
      return `<tr class="${i % 2 ? "alt" : ""}">
        <td class="c">${i + 1}</td>
        <td class="ref">${escapeHtml(l.ref || "—")}</td>
        <td class="desig">${escapeHtml(l.designation || "")}${
          l.unite
            ? `<div class="sub">${escapeHtml(String(l.unite))}</div>`
            : ""
        }</td>
        <td class="num">${qte}</td>
        <td class="num">${formatMoney(prixU)}</td>
        <td class="num">${tva}%</td>
        <td class="num strong">${formatMoney(htLigne)}</td>
      </tr>`;
    })
    .join("");
}

export type PrintDevisOptions = {
  /** true = image papier à en-tête ; false = zones vides (papier déjà imprimé). */
  withLetterhead?: boolean;
};

/**
 * Impression devis client — même fond lettre-speedyprint.png que facture.
 */
export function buildDevisPrintHtml(
  d: Devis,
  options: PrintDevisOptions = {}
): string {
  const withLetterhead = options.withLetterhead !== false;
  const { ht, tva, ttc, tvaLabel } = calcMontants(d);
  const client = clientInfo(d);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const letterUrl = `${origin}/lettre-speedyprint.png`;

  const pageBg = withLetterhead
    ? `background: #fff url("${escapeHtml(letterUrl)}") center top / 210mm 297mm no-repeat;`
    : "background: #fff;";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Devis ${escapeHtml(d.numeroDevis)}</title>
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
  .box .name {
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .box .line { margin: 2px 0; color: #333; }
  .box .line b { color: #111; }

  .doc-title {
    text-align: left;
    font-size: 16px;
    font-weight: 800;
    margin: 4px 0 10px;
    color: #111;
  }

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
    vertical-align: middle;
  }
  table.lines tbody td {
    padding: 7px 6px;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: middle;
    text-align: center;
  }
  table.lines tr.alt td { background: #faf7f4; }
  td.c, th.c { width: 28px; }
  td.ref { width: 14%; font-family: Consolas, monospace; font-size: 10px; }
  td.desig { text-align: center; }
  td.desig .sub { color: #777; font-size: 9px; margin-top: 2px; }
  td.num, th.num { white-space: nowrap; }
  td.strong { font-weight: 800; }

  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 16px;
    margin-top: 12px;
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
  .totals tr.ttc td {
    background: ${ACCENT};
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    border: none;
    padding: 8px;
  }

  @media print {
    .page { width: 210mm; height: 297mm; }
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
        <h3>Devis</h3>
        <div class="line">N° : <b>${escapeHtml(d.numeroDevis)}</b></div>
        <div class="line">Date d'émission : <b>${formatDateFR(d.date)}</b></div>
        <div class="line">Règlement : <b>${escapeHtml(d.typeReglement)}</b></div>
        <div class="line">Échéance : <b>${formatDateFR(d.echeance)}</b></div>
      </div>
    </div>

    <div class="doc-title">Détail Devis</div>

    <table class="lines">
      <thead>
        <tr>
          <th class="c">N°</th>
          <th>Réf</th>
          <th>Désignation</th>
          <th class="num">Qté</th>
          <th class="num">Prix/U</th>
          <th class="num">TVA</th>
          <th class="num">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHtml(d)}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div class="payment-note">
        <strong>Conditions</strong>
        <div class="pay-line"><span class="pay-lab">Mode :</span> <b>${escapeHtml(d.typeReglement || "—")}</b></div>
        <div class="pay-line"><span class="pay-lab">Échéance :</span> <b>${formatDateFR(d.echeance)}</b></div>
      </div>
      <table class="totals">
        <tr><td>Total HT</td><td>${formatMoney(ht)}</td></tr>
        <tr><td>${escapeHtml(tvaLabel)}</td><td>${formatMoney(tva)}</td></tr>
        <tr class="ttc"><td>Total TTC</td><td>${formatMoney(ttc)}</td></tr>
      </table>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function printDevis(
  d: Devis,
  options: PrintDevisOptions = {}
): boolean {
  return printHtmlDocument(buildDevisPrintHtml(d, options));
}

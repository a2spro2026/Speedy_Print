import { loadClients } from "@/lib/clients";
import { formatDateFR, type FactureVente } from "@/lib/factures-vente";
import { formatMoney } from "@/lib/money";
import { montantEnLettres } from "@/lib/montant-en-lettres";
import { printHtmlDocument } from "@/lib/print-html";
import { loadReglementsClient } from "@/lib/reglements-client";

/** Accent facture (totaux) — hors conception papier à en-tête. */
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

function lignesHtml(f: FactureVente): string {
  return (f.lignes ?? [])
    .map((l, i) => {
      const qte = Number(l.qte) || 0;
      const prixU = Number(l.prixU) || 0;
      const remise = Number(l.remise) || 0;
      const tva = f.typeFacture === "Exonéré" ? 0 : Number(l.tva) || 0;
      const brut = qte * prixU;
      const htLigne = round2(
        brut * (1 - Math.min(Math.max(remise, 0), 100) / 100)
      );
      return `<tr class="${i % 2 ? "alt" : ""}">
        <td class="desig">
          ${escapeHtml(l.designation || "—")}
          ${l.unite ? `<div class="sub">Unité : ${escapeHtml(l.unite)}</div>` : ""}
          ${remise > 0 ? `<div class="sub">Remise ${remise}%</div>` : ""}
        </td>
        <td class="num">${qte}</td>
        <td class="num">${formatMoney(prixU)}</td>
        <td class="num">${tva}%</td>
        <td class="num strong">${formatMoney(htLigne)}</td>
      </tr>`;
    })
    .join("");
}

export type PrintFactureOptions = {
  /** true = image papier à en-tête telle quelle ; false = zones vides (papier déjà imprimé). */
  withLetterhead?: boolean;
};

/**
 * Impression facture client.
 * Conception en-tête / pied = image lettre-speedyprint.png (inchangée).
 * Seul le contenu facture est injecté dans la zone centrale.
 */
export function buildFactureVentePrintHtml(
  f: FactureVente,
  options: PrintFactureOptions = {}
): string {
  const withLetterhead = options.withLetterhead !== false;
  const { ht, tva, ttc, tvaLabel } = calcMontants(f);
  const client = clientInfo(f);
  const pay = paymentInfo(f);
  const lettres = montantEnLettres(ttc);
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
<title>Facture ${escapeHtml(f.numeroFacture)}</title>
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
    background: #111;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    border: none;
    padding: 8px;
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
        ${client.contact ? `<div class="line">${escapeHtml(client.contact)}</div>` : ""}
        ${client.ville ? `<div class="line">${escapeHtml(client.ville)}</div>` : ""}
        ${client.ice ? `<div class="line">ICE : <b>${escapeHtml(client.ice)}</b></div>` : ""}
      </div>
      <div class="box">
        <h3>Facture</h3>
        <div class="line">N° : <b>${escapeHtml(f.numeroFacture)}</b></div>
        <div class="line">Date d'émission : <b>${formatDateFR(f.date)}</b></div>
        <div class="line">Règlement : <b>${escapeHtml(f.typeReglement)}</b></div>
      </div>
    </div>

    <div class="doc-title">Détail Facture</div>

    <table class="lines">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="num">Qté</th>
          <th class="num">Prix/U</th>
          <th class="num">TVA</th>
          <th class="num">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHtml(f)}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div class="payment-note">
        <strong>Informations de paiement</strong>
        <div class="pay-line"><span class="pay-lab">Mode :</span> <b>${escapeHtml(pay.mode)}</b></div>
        <div class="pay-line"><span class="pay-lab">N° :</span> <b>${escapeHtml(pay.numero)}</b></div>
        <div class="pay-line"><span class="pay-lab">Nom Tiré :</span> <b>${escapeHtml(pay.nomTire)}</b></div>
        <div class="pay-line"><span class="pay-lab">Date Encaiss :</span> <b>${escapeHtml(pay.dateEncaisse)}</b></div>
      </div>
      <table class="totals">
        <tr><td>Total HT</td><td>${formatMoney(ht)}</td></tr>
        <tr><td>${escapeHtml(tvaLabel)}</td><td>${formatMoney(tva)}</td></tr>
        <tr class="ttc"><td>Total TTC</td><td>${formatMoney(ttc)}</td></tr>
      </table>
    </div>

    <div class="montant-lettres">
      <span class="lab">Arrêté la présente facture à la somme de</span>
      <span class="val">${escapeHtml(lettres)}</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Impression facture client (iframe, sans popup bloquée).
 */
export function printFactureVente(
  f: FactureVente,
  options: PrintFactureOptions = {}
): boolean {
  return printHtmlDocument(buildFactureVentePrintHtml(f, options));
}

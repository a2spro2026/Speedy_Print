/**
 * Convertit un montant en lettres (français).
 * Ex. 1234.50 → "mille deux cent trente-quatre dirhams et cinquante centimes"
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

function underHundred(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;

  if (t === 7 || t === 9) {
    const base = t === 7 ? "soixante" : "quatre-vingt";
    const rest = 10 + u;
    if (t === 9 && u === 0) return "quatre-vingts";
    if (u === 1 && t === 7) return `${base} et ${UNITS[rest]}`;
    return `${base}-${UNITS[rest]}`;
  }

  if (t === 8) {
    if (u === 0) return "quatre-vingts";
    return `quatre-vingt-${UNITS[u]}`;
  }

  if (u === 0) return TENS[t];
  if (u === 1) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hundreds =
    h === 1 ? "cent" : `${UNITS[h]} cent${r === 0 ? "s" : ""}`;
  if (r === 0) return hundreds;
  return `${h === 1 ? "cent" : `${UNITS[h]} cent`} ${underHundred(r)}`;
}

function integerToFrench(n: number): string {
  if (n === 0) return "zéro";
  if (n < 0) return `moins ${integerToFrench(-n)}`;

  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (millions > 0) {
    if (millions === 1) parts.push("un million");
    else parts.push(`${underThousand(millions)} millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("mille");
    else parts.push(`${underThousand(thousands)} mille`);
  }

  if (rest > 0) parts.push(underThousand(rest));

  return parts.join(" ");
}

/** Montant en lettres (dirhams / centimes), capitalisé. */
export function montantEnLettres(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Zéro dirham";

  const abs = Math.round(Math.abs(n) * 100) / 100;
  const intPart = Math.floor(abs + 1e-9);
  const cents = Math.round((abs - intPart) * 100);

  const dh =
    intPart === 0
      ? "zéro dirham"
      : intPart === 1
        ? "un dirham"
        : `${integerToFrench(intPart)} dirhams`;

  let text = dh;
  if (cents > 0) {
    const ct =
      cents === 1
        ? "un centime"
        : `${integerToFrench(cents)} centimes`;
    text = `${dh} et ${ct}`;
  }

  if (n < 0) text = `moins ${text}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

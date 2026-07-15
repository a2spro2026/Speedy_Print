/**
 * Format monétaire SpeedyPrint : pas de devise, décimales en .00
 * Exemple : 8240 → "8 240.00"
 */
export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";

  const fixed = Math.abs(n).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = n < 0 ? "-" : "";

  return `${sign}${grouped}.${decPart}`;
}

/** Pour les champs de saisie (toujours 2 décimales, point) */
export function toMoneyInput(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

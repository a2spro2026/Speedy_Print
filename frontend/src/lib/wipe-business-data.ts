/** Clés métier SpeedyPrint (hors auth). */
const BUSINESS_KEYS = [
  "speedyprint.clients",
  "speedyprint.fournisseurs",
  "speedyprint.devis",
  "speedyprint.factures-achat",
  "speedyprint.factures-vente",
  "speedyprint.reglements-client",
  "speedyprint.reglements-fournisseur",
  "speedyprint.produits",
  "speedyprint.services",
] as const;

const WIPE_FLAG = "speedyprint.wipe.v1";

/**
 * Vide une fois les données de saisie locales (préparation livraison client).
 * Ne touche pas à la session / e-mail mémorisé.
 */
export function wipeBusinessDataOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(WIPE_FLAG) === "1") return;
    for (const key of BUSINESS_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.setItem(WIPE_FLAG, "1");
  } catch {
    /* ignore */
  }
}

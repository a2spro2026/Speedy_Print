/** Clés métier SpeedyPrint (stockage partagé serveur). */
export const BUSINESS_STORAGE_KEYS = [
  "speedyprint.clients",
  "speedyprint.fournisseurs",
  "speedyprint.devis",
  "speedyprint.factures-achat",
  "speedyprint.bons-commande-achat",
  "speedyprint.factures-vente",
  "speedyprint.reglements-client",
  "speedyprint.reglements-fournisseur",
  "speedyprint.produits",
  "speedyprint.services",
] as const;

export type BusinessStorageKey = (typeof BUSINESS_STORAGE_KEYS)[number];

export function isBusinessStorageKey(key: string): key is BusinessStorageKey {
  return (BUSINESS_STORAGE_KEYS as readonly string[]).includes(key);
}

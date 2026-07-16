import {
  loadProduits,
  nextProduitRef,
  saveProduits,
  type Produit,
} from "@/lib/produits";
import {
  loadServices,
  nextServiceRef,
  saveServices,
  type Service,
} from "@/lib/services";

export type CatalogKind = "produit" | "service";

export function inferCatalogKind(ref?: string): CatalogKind {
  return /^Srv/i.test((ref ?? "").trim()) ? "service" : "produit";
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Assure qu’une désignation saisie sur devis/facture existe en fiche
 * produit ou service. Retourne la réf à stocker sur la ligne.
 */
export function ensureCatalogItem(opts: {
  kind: CatalogKind;
  designation: string;
  prixU: number;
  unite: string;
  ref?: string;
}): { ref: string; kind: CatalogKind; created: boolean } {
  const designation = opts.designation.trim();
  const prixU = Number(opts.prixU) || 0;
  const unite = (opts.unite || "U").trim() || "U";
  const wantedRef = (opts.ref ?? "").trim();

  if (!designation) {
    return { ref: wantedRef, kind: opts.kind, created: false };
  }

  if (opts.kind === "service") {
    const list = loadServices();
    const byRef = wantedRef
      ? list.find((s) => s.ref.toLowerCase() === wantedRef.toLowerCase())
      : undefined;
    const byName = list.find((s) => norm(s.designation) === norm(designation));
    const existing = byRef ?? byName;

    if (existing) {
      const next = list.map((s) =>
        s.ref === existing.ref
          ? {
              ...s,
              designation,
              unite: unite || s.unite,
              prixVente: prixU > 0 ? prixU : s.prixVente,
            }
          : s
      );
      saveServices(next);
      return { ref: existing.ref, kind: "service", created: false };
    }

    const created: Service = {
      ref: nextServiceRef(list),
      designation,
      unite,
      prixVente: prixU,
      actif: true,
    };
    saveServices([created, ...list]);
    return { ref: created.ref, kind: "service", created: true };
  }

  const list = loadProduits();
  const byRef = wantedRef
    ? list.find((p) => p.ref.toLowerCase() === wantedRef.toLowerCase())
    : undefined;
  const byName = list.find((p) => norm(p.designation) === norm(designation));
  const existing = byRef ?? byName;

  if (existing) {
    const next = list.map((p) =>
      p.ref === existing.ref
        ? {
            ...p,
            designation,
            prixVente: prixU > 0 ? prixU : p.prixVente,
          }
        : p
    );
    saveProduits(next);
    return { ref: existing.ref, kind: "produit", created: false };
  }

  const created: Produit = {
    ref: nextProduitRef(list),
    designation,
    qteInitiale: 0,
    achats: 0,
    prixAchat: 0,
    prixVente: prixU,
    actif: true,
  };
  saveProduits([created, ...list]);
  return { ref: created.ref, kind: "produit", created: true };
}

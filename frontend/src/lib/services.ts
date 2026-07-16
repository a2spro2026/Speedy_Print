export type Service = {
  ref: string; // Srv0001
  designation: string;
  unite: string; // U
  prixVente: number; // P/V
  actif: boolean;
};

export const UNITES_SERVICE = ["U", "Kg", "L", "M", "M²", "M³", "Lot", "Hrs"] as const;

const STORAGE_KEY = "speedyprint.services";

function padRef(n: number): string {
  return `Srv${String(n).padStart(4, "0")}`;
}

export function nextServiceRef(existing: Service[]): string {
  let max = 0;
  for (const s of existing) {
    const m = /^Srv(\d+)$/i.exec(s.ref);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padRef(max + 1);
}

export function loadServices(): Service[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Service>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((s) => ({
        ref: s.ref || "",
        designation: s.designation ?? "",
        unite: s.unite || "U",
        prixVente: Number(s.prixVente) || 0,
        actif: s.actif !== false,
      }))
      .filter((s) => /^Srv\d+$/i.test(s.ref));
  } catch {
    return [];
  }
}

export function saveServices(list: Service[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

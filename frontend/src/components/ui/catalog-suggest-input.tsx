"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Produit } from "@/lib/produits";
import type { Service } from "@/lib/services";

export type CatalogSuggestItem = {
  kind: "produit" | "service";
  ref: string;
  designation: string;
  unite: string;
  prixVente: number;
};

export function buildCatalogSuggestItems(
  produits: Produit[],
  services: Service[]
): CatalogSuggestItem[] {
  const fromProduits: CatalogSuggestItem[] = produits
    .filter((p) => p.actif !== false)
    .map((p) => ({
      kind: "produit",
      ref: p.ref,
      designation: p.designation,
      unite: "U",
      prixVente: p.prixVente,
    }));
  const fromServices: CatalogSuggestItem[] = services
    .filter((s) => s.actif !== false)
    .map((s) => ({
      kind: "service",
      ref: s.ref,
      designation: s.designation,
      unite: s.unite || "U",
      prixVente: s.prixVente,
    }));
  return [...fromProduits, ...fromServices].sort((a, b) =>
    a.designation.localeCompare(b.designation, "fr")
  );
}

type CatalogSuggestInputProps = {
  mode: "ref" | "designation";
  value: string;
  items: CatalogSuggestItem[];
  onChange: (value: string) => void;
  onSelect: (item: CatalogSuggestItem) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

/** Suggestions dès la 1ʳᵉ lettre / chiffre (réf ou désignation). */
export function CatalogSuggestInput({
  mode,
  value,
  items,
  onChange,
  onSelect,
  readOnly,
  className,
  placeholder,
}: CatalogSuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = value.trim().toLowerCase();

  const matches = useMemo(() => {
    if (query.length < 1) return [];
    return items
      .filter((item) => {
        const ref = item.ref.toLowerCase();
        const des = item.designation.toLowerCase();
        if (mode === "ref") {
          return ref.startsWith(query) || des.startsWith(query);
        }
        return des.startsWith(query) || ref.startsWith(query);
      })
      .slice(0, 12);
  }, [items, mode, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(item: CatalogSuggestItem) {
    onSelect(item);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
        onChange={(e) => {
          if (readOnly) return;
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (!readOnly && query.length >= 1) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (readOnly || !open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && matches[active]) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && !readOnly && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-40 mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
          )}
        >
          {matches.map((item, i) => (
            <li key={`${item.kind}-${item.ref}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col gap-0.5 px-2.5 py-1.5 text-left text-[12px] transition",
                  i === active ? "bg-brand/10 text-ink" : "hover:bg-slate-50"
                )}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
              >
                <span className="font-semibold tabular-nums text-brand">
                  {item.ref}
                  <span className="ml-1.5 text-[10px] font-medium uppercase text-slate-400">
                    {item.kind === "service" ? "Service" : "Produit"}
                  </span>
                </span>
                <span className="truncate text-ink">{item.designation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

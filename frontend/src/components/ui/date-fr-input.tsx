"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatDateFR, maskDateFRInput, parseDateFR } from "@/lib/date-fr";
import { cn } from "@/lib/utils";

type DateFrInputProps = {
  value?: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
};

/** Champ date / échéance au format JJ/MM/AAAA (valeur interne ISO). */
export function DateFrInput({
  value = "",
  onChange,
  readOnly,
  disabled,
  className,
  placeholder = "JJ/MM/AAAA",
  id,
  name,
  autoFocus,
}: DateFrInputProps) {
  const [text, setText] = useState(() => (value ? formatDateFR(value) : ""));

  useEffect(() => {
    setText(value ? formatDateFR(value) : "");
  }, [value]);

  function commit(nextText: string) {
    const iso = parseDateFR(nextText);
    if (iso) {
      onChange(iso);
      setText(formatDateFR(iso));
      return;
    }
    if (!nextText.trim()) {
      onChange("");
      setText("");
      return;
    }
    // invalide : revenir à la valeur connue
    setText(value ? formatDateFR(value) : "");
  }

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      autoComplete="off"
      autoFocus={autoFocus}
      readOnly={readOnly}
      disabled={disabled}
      value={text}
      onChange={(e) => {
        if (readOnly || disabled) return;
        setText(maskDateFRInput(e.target.value));
      }}
      onBlur={() => commit(text)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(text);
        }
      }}
      className={cn("tabular-nums", className)}
      aria-label={placeholder}
    />
  );
}

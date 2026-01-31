import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";

export interface BankOption {
  name: string;
  code: string;
}

export interface BankSelectorValue {
  bankName: string;
  bankCode: string;
}

interface BankSelectorProps {
  banks: BankOption[];
  loading: boolean;
  value: BankSelectorValue | null;
  onChange: (value: BankSelectorValue) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function BankSelector({
  banks,
  loading,
  value,
  onChange,
  disabled = false,
  placeholder = "Select bank…",
  className,
}: BankSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return banks;
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return banks.filter((b) => {
      const name = b.name.toLowerCase();
      const code = b.code.toLowerCase();
      return tokens.every((t) => name.includes(t) || code.includes(t));
    });
  }, [banks, query]);

  const displayValue = value?.bankName ?? placeholder;

  // Focus search input when dropdown opens; reset query when it closes
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (bank: BankOption) => {
    onChange({ bankName: bank.name, bankCode: bank.code });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || loading}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
            "bg-white/[0.03] border-white/[0.06] text-white",
            "focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/[0.08]",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:text-slate-400",
            !value && "text-slate-500",
            className,
          )}
        >
          <span className="truncate">
            {loading ? "Loading banks…" : displayValue}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(400px,90vw)] max-h-[min(360px,70vh)] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-[#0D0D0D] p-0 shadow-xl"
      >
        <div className="shrink-0 border-b border-white/[0.06] p-2">
          <div className="flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or code…"
              className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>
        <div
          className="min-h-0 shrink overflow-y-auto overflow-x-hidden p-1"
          style={{ maxHeight: "260px" }}
        >
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {banks.length === 0
                ? "No banks loaded."
                : query.trim()
                  ? `No bank found for “${query.trim()}”.`
                  : "No bank found."}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filtered.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => handleSelect(bank)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    "text-white hover:bg-white/[0.08] focus:bg-white/[0.08] focus:outline-none",
                  )}
                >
                  <span className="font-medium">{bank.name}</span>
                  <span className="ml-2 shrink-0 text-slate-500">
                    {bank.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

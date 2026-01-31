import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { BANKS_FALLBACK } from "@/data/banks-fallback";

export interface BankOption {
  name: string;
  code: string;
}

function normalizeBanks(raw: unknown): BankOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (b) => b && typeof b.name === "string" && typeof b.code === "string",
    )
    .map((b) => ({ name: String(b.name).trim(), code: String(b.code).trim() }))
    .filter((b) => b.name && b.code);
}

export function useBanks(): {
  banks: BankOption[];
  loading: boolean;
  error: string | null;
} {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBanks() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) {
            setBanks(BANKS_FALLBACK);
            setLoading(false);
          }
          return;
        }
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/banks`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error ?? "Failed to load banks");
          setBanks(BANKS_FALLBACK);
          return;
        }
        const list = normalizeBanks(json?.banks ?? json?.data ?? []);
        setBanks(list.length > 0 ? list : BANKS_FALLBACK);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load banks");
          setBanks(BANKS_FALLBACK);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBanks();
    return () => {
      cancelled = true;
    };
  }, []);

  return { banks, loading, error };
}

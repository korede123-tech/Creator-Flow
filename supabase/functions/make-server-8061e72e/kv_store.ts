/* Table schema:
CREATE TABLE kv_store_8061e72e (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
*/

import { createClient } from "jsr:@supabase/supabase-js@2";

const client = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

export const set = async (key: string, value: unknown): Promise<void> => {
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_8061e72e")
    .upsert({ key, value });
  if (error) throw new Error(error.message);
};

export const get = async (key: string): Promise<unknown> => {
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_8061e72e")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

export const del = async (key: string): Promise<void> => {
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_8061e72e")
    .delete()
    .eq("key", key);
  if (error) throw new Error(error.message);
};

export const mset = async (
  keys: string[],
  values: unknown[],
): Promise<void> => {
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_8061e72e")
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) throw new Error(error.message);
};

export const mget = async (keys: string[]): Promise<unknown[]> => {
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_8061e72e")
    .select("value")
    .in("key", keys);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: { value: unknown }) => d.value);
};

export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_8061e72e")
    .delete()
    .in("key", keys);
  if (error) throw new Error(error.message);
};

export const getByPrefix = async (prefix: string): Promise<unknown[]> => {
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_8061e72e")
    .select("key, value")
    .like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: { value: unknown }) => d.value);
};

// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// Use supabase-js v2 via esm.sh for consistency with other functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ORIGIN_ALLOWLIST") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
  "Cache-Control": "no-store"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { emails } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "emails[] required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabase = createClient(url, key);

    // Admin list (first 200)
    const { data, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) {
      return new Response(JSON.stringify({ error: listErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const want = new Set(emails.map((e: string) => (e || "").toLowerCase()));
    const users = data?.users || [];
    const found = users.filter((u: any) => u?.email && want.has(String(u.email).toLowerCase()));

    const results: any[] = [];
    for (const u of found) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, role, status, created_at")
        .eq("id", u.id)
        .maybeSingle();
      results.push({ email: u.email, id: u.id, profile: prof || null });
    }

    return new Response(JSON.stringify({ count: results.length, results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("profiles-by-email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});

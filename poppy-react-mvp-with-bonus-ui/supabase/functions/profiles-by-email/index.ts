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
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;

    // Auth: admin only unless internal service key
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    const token = authHeader.replace(/^[Bb]earer\s+/, '');
    let isAdmin = false;
    if (token === serviceKey) {
      isAdmin = true;
    } else {
      const supabaseAuth = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
      const supabaseCheck = createClient(url, serviceKey);
      const { data: prof } = await supabaseCheck.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
      isAdmin = prof?.role === 'admin';
    }
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    const { emails } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "emails[] required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

  const supabase = createClient(url, serviceKey);

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

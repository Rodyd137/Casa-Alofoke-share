// Cloudflare Pages Function: /api/state
// Requires: KV binding named ALOFOKE_KV and env var ADMIN_TOKEN
export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.ALOFOKE_KV;
  const KEY = "state";

  if (request.method === "GET") {
    const data = await kv.get(KEY);
    const body = data || JSON.stringify({});
    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  if (request.method === "POST") {
    const token = request.headers.get("x-admin") || "";
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    const toStore = JSON.stringify({ ...payload, updatedAt: new Date().toISOString() });
    await kv.put(KEY, toStore);
    return new Response(toStore, { headers: { "content-type": "application/json" } });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

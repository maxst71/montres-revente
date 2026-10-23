// API unique : lit et enregistre toutes les données de l'outil dans Netlify Blobs.
// Protégée par le mot de passe défini dans la variable d'environnement APP_PASSWORD.
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const DATA_KEY = "donnees";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function passwordOk(given) {
  const expected = process.env.APP_PASSWORD || "";
  if (!expected || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function handle(req, store) {
  if (!process.env.APP_PASSWORD) {
    return json({ erreur: "APP_PASSWORD n'est pas configuré sur Netlify." }, 500);
  }
  if (!passwordOk(req.headers.get("x-password"))) {
    return json({ erreur: "Mot de passe incorrect." }, 401);
  }

  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "");

  if (path === "donnees" && req.method === "GET") {
    const data = (await store.get(DATA_KEY, { type: "json" })) || null;
    return json({ data });
  }

  if (path === "donnees" && req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ erreur: "JSON invalide." }, 400);
    }
    if (!body || !Array.isArray(body.montres) || typeof body.reglages !== "object") {
      return json({ erreur: "Format de données invalide." }, 400);
    }
    body.majLe = new Date().toISOString();
    await store.setJSON(DATA_KEY, body);
    // Une sauvegarde par jour, pour pouvoir revenir en arrière en cas d'erreur.
    await store.setJSON(`sauvegarde-${body.majLe.slice(0, 10)}`, body);
    return json({ ok: true, majLe: body.majLe });
  }

  if (path === "login" && req.method === "POST") {
    return json({ ok: true });
  }

  return json({ erreur: "Route inconnue." }, 404);
}

export default async (req) => handle(req, getStore({ name: "montres", consistency: "strong" }));

export const config = { path: "/api/*" };

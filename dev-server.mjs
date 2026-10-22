// Serveur local pour tester sans Netlify : `APP_PASSWORD=test npm run dev`, puis http://localhost:8888
// Les données sont gardées en mémoire et perdues à l'arrêt.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handle } from "./netlify/functions/api.mjs";

const memoire = new Map();
const store = {
  get: async (k) => (memoire.has(k) ? JSON.parse(memoire.get(k)) : null),
  setJSON: async (k, v) => memoire.set(k, JSON.stringify(v)),
};
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
process.env.APP_PASSWORD ||= "test";

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const r = await handle(request, store);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(await r.text());
  }
  const file = join("public", normalize(url.pathname === "/" ? "/index.html" : url.pathname));
  try {
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Introuvable");
  }
}).listen(8888, () => console.log("http://localhost:8888 (mot de passe : " + process.env.APP_PASSWORD + ")"));

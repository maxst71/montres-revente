// Version Netlify de l'API : données dans Netlify Blobs, mot de passe dans APP_PASSWORD.
import { getStore } from "@netlify/blobs";
import { handle } from "../../lib/api.mjs";

export default async (req) =>
  handle(req, getStore({ name: "montres", consistency: "strong" }), process.env.APP_PASSWORD);

export const config = { path: "/api/*" };

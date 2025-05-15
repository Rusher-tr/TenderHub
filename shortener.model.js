// models/shortener.model.js
import { db } from "../fort/db-client.js";
import { nanoid } from "nanoid";

// 1) Load all links
export async function loadLinks() {
  const [rows] = await db.execute("SELECT * FROM links");
  return rows;
}

// 2) Save a new link and return its short code
export async function saveLinks(url) {
  const code = nanoid(8);
  await db.execute(
    "INSERT INTO links (url, short_code) VALUES (?, ?)",
    [url, code]
  );
  return code;
}

// 3) Lookup the original URL by short code
export async function getLinkByShortCode(shortCode) {
  const [rows] = await db.execute(
    "SELECT url FROM links WHERE short_code = ?",
    [shortCode]
  );
  if (!rows.length) return null;
  return rows[0].url;
}

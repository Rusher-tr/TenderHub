// controllers/shortener.controller.js
import { loadLinks, saveLinks, getLinkByShortCode } from "../models/shortener.model.js";
//import { urls } from "../schema/url/_schema.js";

export async function getShortenerPage(req, res) {
  try {
    const links = await loadLinks();
    return res.render("index", {
      links,
      host: req.get("host"),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
}

export async function postShortenerLink(req, res) {
  try {
    const { url } = urls.parse(req.body);
    const short = await saveLinks(url);
    res.json({ short });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
}

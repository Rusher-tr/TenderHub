// routes/shortener.routes.js
import { Router } from "express";
import {
  getShortenerPage,
  postShortenerLink
} from "../controllers/shortener.controller.js";


export const shortenerRouter = new Router();

shortenerRouter.get("/", getShortenerPage);
shortenerRouter.post("/shorten", postShortenerLink);

export default shortenerRouter;
// routes/auth.routes.js
import { Router } from "express";
import { signup, login, validateToken } from "../controllers/auth.controller.js";
import { authMiddleware } from "../fort/auth-middleware.js";

const router = new Router();

router.post("/signup", signup);
router.post("/login",  login);
router.get("/validate-token", authMiddleware, validateToken);

export default router;

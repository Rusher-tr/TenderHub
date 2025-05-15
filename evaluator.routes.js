import { Router } from "express";
import { 
  createEvaluationHandler,
  getMyEvaluations,
  getBidEvaluations
} from "../controllers/evaluator.controller.js";

const router = Router();

// Authentication middleware
router.use((req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
});

// Evaluator-only routes
router.post("/", (req, res, next) => {
  if (req.user.role !== "Evaluator") return res.status(403).json({ error: "Evaluator access required" });
  next();
}, createEvaluationHandler);

router.get("/my-evaluations", getMyEvaluations);

// Public route (view evaluations for a bid)
router.get("/bid/:bidId", getBidEvaluations);

export default router;
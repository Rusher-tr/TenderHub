import { Router } from "express";
import { 
  listUsers,
  updateUser,
  removeUser
} from "../controllers/admin.controller.js";

const router = Router();

// Admin-only access
router.use((req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});

// User management endpoints
router.get("/users", listUsers);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", removeUser);

export default router;
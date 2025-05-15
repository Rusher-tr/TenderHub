import { z } from "zod";
import { getAllUsers, updateUserRole, deleteUser } from "../models/admin.model.js";

const UpdateUserSchema = z.object({
  role: z.enum(['Admin', 'Buyer', 'Bidder', 'Evaluator']),
  contactNumber: z.string().min(10).max(15).optional()
});

export async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (err) {
    console.error("🔥 Admin Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const updateData = UpdateUserSchema.parse(req.body);
    
    // Prevent admin self-modification
    if (userId == req.user.userId) {
      return res.status(403).json({ error: "Cannot modify your own account" });
    }

    await updateUserRole(userId, updateData.role);
    return res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("🔥 Update Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function removeUser(req, res) {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion
    if (userId == req.user.userId) {
      return res.status(403).json({ error: "Cannot delete your own account" });
    }

    await deleteUser(userId);
    return res.status(204).send();

  } catch (err) {
    console.error("🔥 Deletion Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
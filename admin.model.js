import { db } from "../fort/db-client.js";

export async function getAllUsers() {
  const [rows] = await db.execute(
    "SELECT user_id, name, email, role, contact_number FROM user"
  );
  return rows;
}

export async function updateUserRole(userId, newRole) {
  await db.execute(
    "UPDATE user SET role = ? WHERE user_id = ?",
    [newRole, userId]
  );
}

export async function deleteUser(userId) {
  await db.execute(
    "DELETE FROM user WHERE user_id = ?",
    [userId]
  );
}
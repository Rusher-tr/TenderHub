import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../fort/db-client.js";
import { env } from "../fort/env.js";

// Input validation schemas
const SignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1),
  contactNumber: z.string().min(10)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['Admin', 'Buyer', 'Bidder', 'Evaluator'])
});

// JWT signing helper
const jwtSign = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "8h" });

// Signup Controller
export async function signup(req, res) {
  try {
    console.log("📨 Incoming signup payload:", req.body);

    // Destructure and validate
    const { name, email, password, role, contactNumber } = SignupSchema.parse(req.body);
    console.log("✅ Zod validated:", { name, email });

    // Check existing user
    const [rows] = await db.execute("SELECT user_id FROM user WHERE email = ?", [email]);
    if (rows.length) {
      console.log("⚠️ Email already registered");
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password and insert user FIRST
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO user (name, email, password, role, contact_number) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, role, contactNumber]
    );
    console.log("✅ User created with ID:", result.insertId);

    // For Buyers ONLY: Insert organization data AFTER user is created
    if (role === 'Buyer') {
      const { organizationAddress } = req.body; // Get from request body
      await db.execute(
        "INSERT INTO Organization (user_id, organization_name, contact_phone, address) VALUES (?, ?, ?, ?)",
        [result.insertId, name, contactNumber, organizationAddress] // Use the new user's ID
      );
      console.log("✅ Organization created for Buyer");
    }

    // Generate JWT
    const token = jwtSign({ userId: result.insertId, role }); // Include role in JWT
    return res.status(201).json({ token });

  } catch (err) {
    console.error("🔥 Signup Error:", err);
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Login Controller
export async function login(req, res) {
  try {
    console.log("📨 Incoming login payload:", req.body);

    const { email, password, role } = LoginSchema.parse(req.body);
    console.log("✅ Zod validated:", { email, role });

    const [rows] = await db.execute(
      "SELECT user_id, password, role FROM user WHERE email = ? AND role = ?", 
      [email, role]
    );

    if (!rows.length) {
      console.log("❌ Invalid email or role");
      return res.status(401).json({ error: "Invalid credentials or incorrect role" });
    }

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) {
      console.log("❌ Incorrect password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwtSign({ 
      userId: rows[0].user_id,
      role: rows[0].role 
    });
    console.log("✅ Login successful, token generated");
    return res.json({ token, role: rows[0].role });

  } catch (err) {
    console.error("🔥 Login Error:", err);
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Validate token endpoint
export async function validateToken(req, res) {
  // If the middleware passed, the token is valid
  if (req.user) {
    return res.status(200).json({ 
      valid: true, 
      user: { 
        userId: req.user.userId, 
        role: req.user.role 
      } 
    });
  }
  
  // This shouldn't happen if middleware is working correctly
  return res.status(401).json({ valid: false });
}

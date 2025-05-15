// config/env.js
import { z } from "zod";
import dotenv from "dotenv";

// Load variables from .env into process.env
dotenv.config();

export const env = z
  .object({
    PORT: z.coerce.number().default(5000),
    DATABASE_HOST: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_NAME: z.string(),
    JWT_SECRET: z.string().min(10),
  })
  .parse(process.env);

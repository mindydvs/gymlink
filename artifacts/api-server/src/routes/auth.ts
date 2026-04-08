import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

const router: IRouter = Router();

const AVATARS = ["💪", "🏋️", "🤸", "🧘", "🏃", "🚴", "🥊", "⚡", "🔥", "🦾", "🎯", "🏅"];
const SALT_ROUNDS = 10;

const RegisterBody = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(13).max(120),
  bio: z.string().max(300).default(""),
  gymId: z.string().optional(),
  gymName: z.string().optional(),
  schedule: z.string().default(""),
  interests: z.array(z.string()).default([]),
  password: z.string().min(6).max(128),
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, age, bio, gymId, gymName, schedule, interests, password } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(ilike(usersTable.name, name));
  if (existing.length > 0) {
    res.status(409).json({ error: "That name is already taken. Please choose another." });
    return;
  }

  const id = nanoid(12);
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      name,
      age,
      avatar,
      bio,
      gym: gymName ?? "",
      gymId: gymId ?? null,
      schedule,
      interests,
      verified: false,
      distance: `${(Math.random() * 0.9 + 0.1).toFixed(1)} mi`,
      isMe: false,
      activeNow: false,
      checkedIn: false,
      passwordHash,
    })
    .returning();

  res.status(201).json({ userId: user.id });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = z.object({ name: z.string(), password: z.string() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Name and password are required" });
    return;
  }

  const { name, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(ilike(usersTable.name, name));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Incorrect name or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect name or password" });
    return;
  }

  res.json({ userId: user.id });
});

export default router;

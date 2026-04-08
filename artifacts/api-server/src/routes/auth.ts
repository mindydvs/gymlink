import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

const AVATARS = ["💪", "🏋️", "🤸", "🧘", "🏃", "🚴", "🥊", "⚡", "🔥", "🦾", "🎯", "🏅"];

const RegisterBody = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(13).max(120),
  bio: z.string().max(300).default(""),
  gymId: z.string().optional(),
  gymName: z.string().optional(),
  schedule: z.string().default(""),
  interests: z.array(z.string()).default([]),
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, age, bio, gymId, gymName, schedule, interests } = parsed.data;
  const id = nanoid(12);
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

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
    })
    .returning();

  res.status(201).json({ userId: user.id, user });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { userId } = z.object({ userId: z.string() }).parse(req.body);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ userId: user.id, user });
});

router.get("/auth/users", async (_req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar, gym: usersTable.gym })
    .from(usersTable);
  res.json(users);
});

export default router;

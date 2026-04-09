import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { getResendClient } from "../lib/resend.js";

const router: IRouter = Router();

const AVATARS = ["💪", "🏋️", "🤸", "🧘", "🏃", "🚴", "🥊", "⚡", "🔥", "🦾", "🎯", "🏅"];
const SALT_ROUNDS = 10;

const RegisterBody = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
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
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? parsed.error.message });
    return;
  }

  const { name, username, email, age, bio, gymId, gymName, schedule, interests, password } = parsed.data;

  const existingName = await db.select({ id: usersTable.id }).from(usersTable).where(ilike(usersTable.name, name));
  if (existingName.length > 0) {
    res.status(409).json({ error: "That display name is already taken. Please choose another." });
    return;
  }

  const existingUsername = await db.select({ id: usersTable.id }).from(usersTable).where(ilike(usersTable.username, username));
  if (existingUsername.length > 0) {
    res.status(409).json({ error: "That username is already taken. Please choose another." });
    return;
  }

  const existingEmail = await db.select({ id: usersTable.id }).from(usersTable).where(ilike(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "An account with that email already exists." });
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
      username,
      email,
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
    .where(
      or(ilike(usersTable.name, name), ilike(usersTable.username, name))
    );

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

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }

  const { email } = parsed.data;
  const [user] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(ilike(usersTable.email, email));

  if (!user) {
    res.json({ ok: true });
    return;
  }

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({
    id: nanoid(12),
    userId: user.id,
    token,
    expiresAt,
  });

  const appUrl = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}/gymlink`;
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  try {
    const { client, fromEmail } = await getResendClient();
    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset your GymLink password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#E8193C">GymLink Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#E8193C;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Reset Password
          </a>
          <p style="font-size:13px;color:#666">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err);
    res.status(500).json({ error: "Failed to send email. Please try again." });
    return;
  }

  res.json({ ok: true });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6).max(128),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Token and a new password (min 6 characters) are required" });
    return;
  }

  const { token, newPassword } = parsed.data;
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token));

  if (!record) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }
  if (record.usedAt) {
    res.status(400).json({ error: "This reset link has already been used" });
    return;
  }
  if (new Date() > record.expiresAt) {
    res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, record.id));

  res.json({ ok: true });
});

export default router;

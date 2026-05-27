import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  db,
  userBlocksTable,
  userReportsTable,
  usersTable,
  workoutVideosTable,
} from "@workspace/db";
import { getResendClient } from "../lib/resend.js";

const router: IRouter = Router();

const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL ?? "mindydvs@yahoo.com";

router.get("/blocks", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      blockedId: userBlocksTable.blockedId,
      createdAt: userBlocksTable.createdAt,
      name: usersTable.name,
      avatar: usersTable.avatar,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(userBlocksTable)
    .leftJoin(usersTable, eq(userBlocksTable.blockedId, usersTable.id))
    .where(eq(userBlocksTable.blockerId, req.userId))
    .orderBy(desc(userBlocksTable.createdAt));

  res.json(
    rows.map((r) => ({
      blockedId: r.blockedId,
      name: r.name ?? "Unknown",
      avatar: r.avatar ?? "💪",
      avatarUrl: r.avatarUrl ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/users/:id/block", async (req, res): Promise<void> => {
  const targetId = req.params.id;
  if (targetId === req.userId) {
    res.status(400).json({ error: "You can't block yourself" });
    return;
  }

  await db
    .insert(userBlocksTable)
    .values({ blockerId: req.userId, blockedId: targetId })
    .onConflictDoNothing();

  res.status(201).json({ ok: true });
});

router.delete("/users/:id/block", async (req, res): Promise<void> => {
  await db
    .delete(userBlocksTable)
    .where(
      and(
        eq(userBlocksTable.blockerId, req.userId),
        eq(userBlocksTable.blockedId, req.params.id),
      ),
    );
  res.status(204).end();
});

const ReportBody = z.object({
  reason: z.string().min(1).max(120),
  details: z.string().max(2000).optional(),
});

async function notifyModerator(opts: {
  reporterId: string;
  reporterName: string;
  targetType: "user" | "video";
  targetId: string;
  targetLabel: string;
  reason: string;
  details?: string;
}): Promise<void> {
  try {
    const { client, fromEmail } = await getResendClient();
    await client.emails.send({
      from: fromEmail,
      to: MODERATOR_EMAIL,
      subject: `GymLink report: ${opts.targetType} ${opts.targetId}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#E8193C">New content report</h2>
          <p><strong>Type:</strong> ${opts.targetType}</p>
          <p><strong>Target:</strong> ${opts.targetLabel} (id: ${opts.targetId})</p>
          <p><strong>Reported by:</strong> ${opts.reporterName} (id: ${opts.reporterId})</p>
          <p><strong>Reason:</strong> ${opts.reason}</p>
          ${opts.details ? `<p><strong>Details:</strong><br/>${opts.details.replace(/\n/g, "<br/>")}</p>` : ""}
          <p style="color:#666;font-size:12px;margin-top:24px">Please review within 24 hours. Reply to the reporter directly if you need more info.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send moderation email:", err);
  }
}

router.post("/users/:id/report", async (req, res): Promise<void> => {
  const parsed = ReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Reason is required" });
    return;
  }

  const targetId = req.params.id;
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [reporter] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  await db.insert(userReportsTable).values({
    id: nanoid(12),
    reporterId: req.userId,
    targetType: "user",
    targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  await notifyModerator({
    reporterId: req.userId,
    reporterName: reporter?.name ?? req.userId,
    targetType: "user",
    targetId,
    targetLabel: target.name,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  res.status(201).json({ ok: true });
});

router.post("/videos/:id/report", async (req, res): Promise<void> => {
  const parsed = ReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Reason is required" });
    return;
  }

  const videoId = req.params.id;
  const [video] = await db.select().from(workoutVideosTable).where(eq(workoutVideosTable.id, videoId));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  const [reporter] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));

  await db.insert(userReportsTable).values({
    id: nanoid(12),
    reporterId: req.userId,
    targetType: "video",
    targetId: videoId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  await notifyModerator({
    reporterId: req.userId,
    reporterName: reporter?.name ?? req.userId,
    targetType: "video",
    targetId: videoId,
    targetLabel: video.title,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  res.status(201).json({ ok: true });
});

export default router;

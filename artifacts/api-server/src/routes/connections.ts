import { Router, type IRouter } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, connectionsTable, usersTable, notificationsTable } from "@workspace/db";
import { getHiddenUserIds } from "./users";
import {
  CreateConnectionBody,
  ListConnectionsQueryParams,
  ListConnectionsResponse,
  RespondToConnectionBody,
  RespondToConnectionResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/connections", async (req, res): Promise<void> => {
  const parsed = CreateConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const meId = req.userId;
  const { toUserId, type, anonymous, mutualNotify = false } = parsed.data;

  const hiddenIds = new Set(await getHiddenUserIds(meId));
  if (hiddenIds.has(toUserId)) {
    res.status(403).json({ error: "You can't connect with this user" });
    return;
  }

  const id = randomUUID();
  const [connection] = await db
    .insert(connectionsTable)
    .values({ id, fromUserId: meId, toUserId, type, status: "pending", anonymous, mutualNotify })
    .returning();

  const [meUser] = await db.select().from(usersTable).where(eq(usersTable.id, meId));
  const fromName = meUser?.name ?? "Someone";

  await db.insert(notificationsTable).values({
    id: randomUUID(),
    connectionId: id,
    userId: toUserId,
    type,
    fromName: anonymous ? "Someone" : fromName,
    anonymous,
    read: false,
    responded: false,
  });

  // Check for mutual crush: if both users opted into mutualNotify, notify both
  if (type === "crush" && mutualNotify) {
    const [existingMutual] = await db
      .select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.fromUserId, toUserId),
          eq(connectionsTable.toUserId, meId),
          eq(connectionsTable.type, "crush"),
          eq(connectionsTable.mutualNotify, true)
        )
      );

    if (existingMutual) {
      const [toUserInfo] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));
      const senderName = fromName;
      const otherName = toUserInfo?.name ?? "Someone";

      // Notify the current user (meId) — the other person already had a crush on them
      await db.insert(notificationsTable).values({
        id: randomUUID(),
        connectionId: existingMutual.id,
        userId: meId,
        type: "mutual_crush",
        fromName: otherName,
        anonymous: false,
        read: false,
        responded: false,
      });

      // Notify toUserId — this user now also has a crush on them
      await db.insert(notificationsTable).values({
        id: randomUUID(),
        connectionId: id,
        userId: toUserId,
        type: "mutual_crush",
        fromName: senderName,
        anonymous: false,
        read: false,
        responded: false,
      });
    }
  }

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, meId));
  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));

  res.status(201).json({
    ...connection,
    fromUser: fromUser ?? null,
    toUser: toUser ?? null,
  });
});

router.get("/connections", async (req, res): Promise<void> => {
  const meId = req.userId;
  const query = ListConnectionsQueryParams.safeParse(req.query);
  let rows = await db
    .select()
    .from(connectionsTable)
    .where(
      or(
        eq(connectionsTable.fromUserId, meId),
        eq(connectionsTable.toUserId, meId)
      )
    );

  if (query.success) {
    if (query.data.type) {
      rows = rows.filter((c) => c.type === query.data.type);
    }
    if (query.data.status) {
      rows = rows.filter((c) => c.status === query.data.status);
    }
  }

  const hiddenIds = new Set(await getHiddenUserIds(meId));
  if (hiddenIds.size > 0) {
    rows = rows.filter(
      (c) => !hiddenIds.has(c.fromUserId) && !hiddenIds.has(c.toUserId),
    );
  }

  const allUserIds = [...new Set(rows.flatMap((c) => [c.fromUserId, c.toUserId]))];
  if (allUserIds.length === 0) {
    res.json([]);
    return;
  }

  const users = await db.select().from(usersTable).where(
    or(...allUserIds.map((uid) => eq(usersTable.id, uid)))
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const result = rows.map((c) => ({
    ...c,
    fromUser: userMap[c.fromUserId] ?? null,
    toUser: userMap[c.toUserId] ?? null,
  }));

  res.json(ListConnectionsResponse.parse(result));
});

router.post("/connections/:id/respond", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const parsed = RespondToConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const newStatus = parsed.data.response === "accept" ? "accepted" : "declined";

  const [connection] = await db
    .update(connectionsTable)
    .set({ status: newStatus })
    .where(eq(connectionsTable.id, raw))
    .returning();

  if (!connection) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ responded: true })
    .where(eq(notificationsTable.connectionId, raw));

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, connection.fromUserId));
  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, connection.toUserId));

  res.json(RespondToConnectionResponse.parse({
    ...connection,
    fromUser: fromUser ?? null,
    toUser: toUser ?? null,
  }));
});

router.delete("/connections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const meId = req.userId;

  const [connection] = await db
    .select()
    .from(connectionsTable)
    .where(
      and(
        eq(connectionsTable.id, raw),
        eq(connectionsTable.fromUserId, meId),
        eq(connectionsTable.status, "pending")
      )
    );

  if (!connection) {
    res.status(404).json({ error: "Connection not found or cannot be cancelled" });
    return;
  }

  await db.delete(notificationsTable).where(eq(notificationsTable.connectionId, raw));
  await db.delete(connectionsTable).where(eq(connectionsTable.id, raw));

  res.json({ success: true });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, connectionsTable, usersTable, notificationsTable } from "@workspace/db";
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
  const { toUserId, type, anonymous } = parsed.data;

  const id = randomUUID();
  const [connection] = await db
    .insert(connectionsTable)
    .values({ id, fromUserId: meId, toUserId, type, status: "pending", anonymous })
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

export default router;

import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, notificationsTable, connectionsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { getHiddenUserIds } from "./users";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId))
    .orderBy(notificationsTable.createdAt);

  const hiddenIds = new Set(await getHiddenUserIds(req.userId));
  if (hiddenIds.size === 0) {
    res.json(ListNotificationsResponse.parse(notifications));
    return;
  }

  const connIds = notifications.map((n) => n.connectionId).filter((x): x is string => !!x);
  const conns = connIds.length
    ? await db.select().from(connectionsTable).where(inArray(connectionsTable.id, connIds))
    : [];
  const connMap = new Map(conns.map((c) => [c.id, c]));
  const filtered = notifications.filter((n) => {
    if (!n.connectionId) return true;
    const c = connMap.get(n.connectionId);
    if (!c) return true;
    return !hiddenIds.has(c.fromUserId) && !hiddenIds.has(c.toUserId);
  });

  res.json(ListNotificationsResponse.parse(filtered));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, raw))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(notification));
});

export default router;

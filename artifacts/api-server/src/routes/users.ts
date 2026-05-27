import { Router, type IRouter } from "express";
import { eq, ilike, and, notInArray, or } from "drizzle-orm";
import { db, usersTable, userBlocksTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserParams,
  GetUserResponse,
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
} from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  const conditions: ReturnType<typeof eq>[] = [eq(usersTable.hidden, false)];

  if (query.success) {
    if (query.data.gym) {
      conditions.push(eq(usersTable.gym, query.data.gym));
    }
    if (query.data.search) {
      conditions.push(ilike(usersTable.name, `%${query.data.search}%`) as ReturnType<typeof eq>);
    }
  }

  const hiddenIds = await getHiddenUserIds(req.userId);
  if (hiddenIds.length > 0) {
    conditions.push(notInArray(usersTable.id, hiddenIds) as ReturnType<typeof eq>);
  }

  const users = await db.select().from(usersTable).where(and(...conditions));
  res.json(ListUsersResponse.parse(users));
});

async function getHiddenUserIds(meId: string): Promise<string[]> {
  const rows = await db
    .select({
      blockerId: userBlocksTable.blockerId,
      blockedId: userBlocksTable.blockedId,
    })
    .from(userBlocksTable)
    .where(
      or(eq(userBlocksTable.blockerId, meId), eq(userBlocksTable.blockedId, meId)),
    );
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.blockerId === meId) ids.add(r.blockedId);
    if (r.blockedId === meId) ids.add(r.blockerId);
  }
  return Array.from(ids);
}

export { getHiddenUserIds };

router.get("/users/me", async (req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!me) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(GetMeResponse.parse(me));
});

router.patch("/users/me", async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [me] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.userId))
    .returning();

  if (!me) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(UpdateMeResponse.parse(me));
});

router.delete("/users/me", async (req, res): Promise<void> => {
  await db.delete(usersTable).where(eq(usersTable.id, req.userId));
  res.status(204).end();
});

router.post("/users/me/checkin", async (req, res): Promise<void> => {
  const { gymId, gymName } = z.object({ gymId: z.string(), gymName: z.string() }).parse(req.body);

  const [me] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId));

  if (!me) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const alreadyCheckedIn = me.checkedIn && me.gymId === gymId;
  const [updated] = await db
    .update(usersTable)
    .set({
      checkedIn: !alreadyCheckedIn,
      gymId: alreadyCheckedIn ? null : gymId,
      gym: alreadyCheckedIn ? me.gym : gymName,
      activeNow: !alreadyCheckedIn,
    })
    .where(eq(usersTable.id, req.userId))
    .returning();

  res.json(GetMeResponse.parse(updated));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, raw));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

export default router;

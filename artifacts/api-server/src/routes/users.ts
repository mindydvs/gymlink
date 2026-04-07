import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserParams,
  GetUserResponse,
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
} from "@workspace/api-zod";
import { z } from "zod/v4";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  let dbQuery = db.select().from(usersTable).$dynamic();

  if (query.success) {
    if (query.data.gym) {
      dbQuery = dbQuery.where(eq(usersTable.gym, query.data.gym));
    }
    if (query.data.search) {
      dbQuery = dbQuery.where(ilike(usersTable.name, `%${query.data.search}%`));
    }
  }

  const users = await dbQuery;
  res.json(ListUsersResponse.parse(users));
});

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

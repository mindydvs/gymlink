import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, connectionsTable } from "@workspace/db";
import { GetGymStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [meUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  const gymName = meUser?.gym ?? "Iron Temple Fitness";

  const allUsers = await db.select().from(usersTable);
  const totalMembers = allUsers.length;
  const activeNow = allUsers.filter((u) => u.activeNow || u.checkedIn).length;

  const connections = await db
    .select()
    .from(connectionsTable)
    .where(eq(connectionsTable.status, "accepted"));

  const crushCount = connections.filter((c) => c.type === "crush").length;
  const buddyCount = connections.filter((c) => c.type === "buddy").length;
  const advisorCount = connections.filter((c) => c.type === "advisor").length;
  const spotterCount = connections.filter((c) => c.type === "spotter").length;

  res.json(GetGymStatsResponse.parse({
    activeNow,
    totalMembers,
    crushCount,
    buddyCount,
    advisorCount,
    spotterCount,
    gymName,
  }));
});

export default router;

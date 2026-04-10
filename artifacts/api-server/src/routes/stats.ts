import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable, connectionsTable } from "@workspace/db";
import { GetGymStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const meId = req.userId;
  const [meUser] = await db.select().from(usersTable).where(eq(usersTable.id, meId));
  const gymName = meUser?.gym ?? "Iron Temple Fitness";

  const allUsers = await db.select().from(usersTable);
  const totalMembers = allUsers.length;
  const activeNow = allUsers.filter((u) => u.activeNow || u.checkedIn).length;

  // Only fetch connections involving the current user
  const myConnections = await db
    .select()
    .from(connectionsTable)
    .where(
      or(
        eq(connectionsTable.fromUserId, meId),
        eq(connectionsTable.toUserId, meId)
      )
    );

  // Buddy / advisor / spotter — only accepted
  const buddyCount   = myConnections.filter((c) => c.type === "buddy"   && c.status === "accepted").length;
  const advisorCount = myConnections.filter((c) => c.type === "advisor" && c.status === "accepted").length;
  const spotterCount = myConnections.filter((c) => c.type === "spotter" && c.status === "accepted").length;

  // Crush — only mutual (I crushed them AND they crushed me)
  const iCrushed    = new Set(myConnections.filter((c) => c.type === "crush" && c.fromUserId === meId).map((c) => c.toUserId));
  const theyCrushed = new Set(myConnections.filter((c) => c.type === "crush" && c.toUserId   === meId).map((c) => c.fromUserId));
  const crushCount  = [...iCrushed].filter((id) => theyCrushed.has(id)).length;

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

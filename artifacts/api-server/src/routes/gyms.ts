import { Router, type IRouter } from "express";
import { db, gymsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/gyms", async (_req, res): Promise<void> => {
  const gyms = await db.select().from(gymsTable).orderBy(gymsTable.name);
  res.json(gyms);
});

export default router;

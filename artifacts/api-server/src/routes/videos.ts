import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, workoutVideosTable } from "@workspace/db";
import { nanoid } from "nanoid";

const router: IRouter = Router();

router.get("/videos", async (req, res): Promise<void> => {
  const userId = (req.query.userId as string) || req.userId;
  const videos = await db
    .select()
    .from(workoutVideosTable)
    .where(eq(workoutVideosTable.userId, userId));
  res.json(videos);
});

router.post("/videos", async (req, res): Promise<void> => {
  const { objectPath, title, description } = req.body as {
    objectPath: string;
    title: string;
    description?: string;
  };

  if (!objectPath || !title) {
    res.status(400).json({ error: "objectPath and title are required" });
    return;
  }

  const [video] = await db
    .insert(workoutVideosTable)
    .values({ id: nanoid(), userId: req.userId, objectPath, title, description })
    .returning();

  res.status(201).json(video);
});

router.delete("/videos/:id", async (req, res): Promise<void> => {
  await db
    .delete(workoutVideosTable)
    .where(
      and(
        eq(workoutVideosTable.id, req.params.id),
        eq(workoutVideosTable.userId, req.userId)
      )
    );
  res.status(204).end();
});

export default router;

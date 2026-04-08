import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, workoutVideosTable, videoLikesTable } from "@workspace/db";
import { nanoid } from "nanoid";

const router: IRouter = Router();

router.get("/videos", async (req, res): Promise<void> => {
  const userId = (req.query.userId as string) || req.userId;
  const videos = await db
    .select()
    .from(workoutVideosTable)
    .where(eq(workoutVideosTable.userId, userId));

  const videosWithLikes = await Promise.all(
    videos.map(async (video) => {
      const status = await getLikeStatus(video.id, req.userId);
      return { ...video, likeCount: status.likeCount, likedByMe: status.likedByMe };
    })
  );

  res.json(videosWithLikes);
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

router.patch("/videos/:id", async (req, res): Promise<void> => {
  const { title } = req.body as { title: string };
  if (!title?.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [updated] = await db
    .update(workoutVideosTable)
    .set({ title: title.trim() })
    .where(
      and(
        eq(workoutVideosTable.id, req.params.id),
        eq(workoutVideosTable.userId, req.userId)
      )
    )
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const status = await getLikeStatus(updated.id, req.userId);
  res.json({ ...updated, likeCount: status.likeCount, likedByMe: status.likedByMe });
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

async function getLikeStatus(videoId: string, userId: string) {
  const [countRow] = await db
    .select({ likeCount: count() })
    .from(videoLikesTable)
    .where(eq(videoLikesTable.videoId, videoId));

  const [myLike] = await db
    .select()
    .from(videoLikesTable)
    .where(and(eq(videoLikesTable.videoId, videoId), eq(videoLikesTable.userId, userId)));

  return {
    videoId,
    likeCount: Number(countRow?.likeCount ?? 0),
    likedByMe: !!myLike,
  };
}

router.get("/videos/:id/likes", async (req, res): Promise<void> => {
  const status = await getLikeStatus(req.params.id, req.userId);
  res.json(status);
});

router.post("/videos/:id/like", async (req, res): Promise<void> => {
  const videoId = req.params.id;
  const userId = req.userId;

  const [existing] = await db
    .select()
    .from(videoLikesTable)
    .where(and(eq(videoLikesTable.videoId, videoId), eq(videoLikesTable.userId, userId)));

  if (existing) {
    await db
      .delete(videoLikesTable)
      .where(and(eq(videoLikesTable.videoId, videoId), eq(videoLikesTable.userId, userId)));
  } else {
    await db.insert(videoLikesTable).values({ videoId, userId });
  }

  const status = await getLikeStatus(videoId, userId);
  res.json(status);
});

export default router;

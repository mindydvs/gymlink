import { Router, type IRouter } from "express";
import { eq, and, desc, or } from "drizzle-orm";
import { db, recipesTable, usersTable } from "@workspace/db";
import { nanoid } from "nanoid";
import { getHiddenUserIds } from "./users";

const router: IRouter = Router();

router.get("/recipes", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;

  const rows = await db
    .select()
    .from(recipesTable)
    .orderBy(desc(recipesTable.createdAt));

  const hiddenIds = new Set(await getHiddenUserIds(req.userId));
  const visible = rows.filter((r) => !hiddenIds.has(r.userId));
  const filtered = userId ? visible.filter((r) => r.userId === userId) : visible;

  const allUserIds = [...new Set(filtered.map((r) => r.userId))];
  const users =
    allUserIds.length > 0
      ? await db
          .select()
          .from(usersTable)
          .where(or(...allUserIds.map((id) => eq(usersTable.id, id))))
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const result = filtered.map((r) => ({
    ...r,
    user: userMap[r.userId]
      ? {
          id: userMap[r.userId].id,
          name: userMap[r.userId].name,
          avatar: userMap[r.userId].avatar,
          avatarUrl: userMap[r.userId].avatarUrl,
        }
      : null,
  }));

  res.json(result);
});

router.post("/recipes", async (req, res): Promise<void> => {
  const { title, description, ingredients, steps, mediaObjectPath, mediaType } =
    req.body as {
      title: string;
      description?: string;
      ingredients?: string[];
      steps?: string[];
      mediaObjectPath?: string;
      mediaType?: string;
    };

  if (!title?.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const [recipe] = await db
    .insert(recipesTable)
    .values({
      id: nanoid(),
      userId: req.userId,
      title: title.trim(),
      description: description?.trim() || null,
      ingredients: Array.isArray(ingredients) ? ingredients.filter(Boolean) : [],
      steps: Array.isArray(steps) ? steps.filter(Boolean) : [],
      mediaObjectPath: mediaObjectPath || null,
      mediaType: mediaType || null,
    })
    .returning();

  res.status(201).json(recipe);
});

router.patch("/recipes/:id", async (req, res): Promise<void> => {
  const { title, description, ingredients, steps } = req.body as {
    title?: string;
    description?: string;
    ingredients?: string[];
    steps?: string[];
  };

  const [updated] = await db
    .update(recipesTable)
    .set({
      ...(title ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(ingredients ? { ingredients } : {}),
      ...(steps ? { steps } : {}),
    })
    .where(
      and(
        eq(recipesTable.id, req.params.id),
        eq(recipesTable.userId, req.userId)
      )
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(updated);
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  await db
    .delete(recipesTable)
    .where(
      and(
        eq(recipesTable.id, req.params.id),
        eq(recipesTable.userId, req.userId)
      )
    );
  res.status(204).end();
});

export default router;

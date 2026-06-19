import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, gymsTable } from "@workspace/db";
import { searchGyms, validateGym, gymIdFor } from "../lib/gymSearch";

const router: IRouter = Router();

router.get("/gyms", async (_req, res): Promise<void> => {
  const gyms = await db.select().from(gymsTable).orderBy(gymsTable.name);
  res.json(gyms);
});

router.get("/gyms/search", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (q.trim().length < 2) {
    res.json([]);
    return;
  }
  try {
    const candidates = await searchGyms(q);
    res.json(candidates);
  } catch {
    res.status(502).json({ error: "Gym search is temporarily unavailable" });
  }
});

const AddGymBody = z.object({
  osmType: z.string(),
  osmId: z.number(),
});

router.post("/gyms", async (req, res): Promise<void> => {
  const parsed = AddGymBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "osmType and osmId are required" });
    return;
  }
  const { osmType, osmId } = parsed.data;

  const id = gymIdFor(osmType, osmId);
  const [existing] = await db
    .select()
    .from(gymsTable)
    .where(eq(gymsTable.id, id));
  if (existing) {
    res.json(existing);
    return;
  }

  let verified;
  try {
    verified = await validateGym(osmType, osmId);
  } catch {
    res.status(502).json({ error: "Could not verify gym right now" });
    return;
  }
  if (!verified) {
    res
      .status(422)
      .json({ error: "That place could not be verified as a real gym" });
    return;
  }

  const [created] = await db
    .insert(gymsTable)
    .values({
      id,
      name: verified.name,
      address: verified.address,
      city: verified.city,
      memberCount: 0,
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    res.status(201).json(created);
    return;
  }

  const [fallback] = await db
    .select()
    .from(gymsTable)
    .where(eq(gymsTable.id, id));
  res.json(fallback);
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import connectionsRouter from "./connections";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";
import gymsRouter from "./gyms";
import authRouter from "./auth";
import storageRouter from "./storage";
import videosRouter from "./videos";
import recipesRouter from "./recipes";
import moderationRouter from "./moderation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gymsRouter);
router.use(usersRouter);
router.use(connectionsRouter);
router.use(notificationsRouter);
router.use(statsRouter);
router.use(storageRouter);
router.use(videosRouter);
router.use(recipesRouter);
router.use(moderationRouter);

export default router;

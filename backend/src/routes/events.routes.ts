import { Router } from "express";
import { getEventDetail, getEventStats, listEvents } from "../controllers/eventController";
import { requireAuth } from "../middleware/auth.middleware";

export const eventsRouter = Router();

eventsRouter.use(requireAuth);
eventsRouter.get("/", listEvents);
eventsRouter.get("/stats", getEventStats);
eventsRouter.get("/:id", getEventDetail);

import { Router } from "express";
import { authRouter } from "./auth.routes";
import { reposRouter } from "./repos.routes";
import { rulesRouter } from "./rules.routes";
import { eventsRouter } from "./events.routes";

export { webhooksRouter } from "./webhooks.routes";

// Mounted after the global JSON body parser. The webhook route is mounted
// separately (and earlier, with a raw body parser) directly in app.ts.
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ status: "ok" }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/repos", reposRouter);
apiRouter.use("/rules", rulesRouter);
apiRouter.use("/events", eventsRouter);

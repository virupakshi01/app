import { Router } from "express";
import {
  connectRepositoryHandler,
  listConnectedRepositories,
  listRepositories,
} from "../controllers/repoController";
import { requireAuth } from "../middleware/auth.middleware";

export const reposRouter = Router();

reposRouter.use(requireAuth);
reposRouter.get("/available", listRepositories);
reposRouter.get("/", listConnectedRepositories);
reposRouter.post("/connect", connectRepositoryHandler);

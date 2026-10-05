import { Router } from "express";
import { createRule, deleteRule, listRules, updateRule } from "../controllers/ruleController";
import { requireAuth } from "../middleware/auth.middleware";

export const rulesRouter = Router();

rulesRouter.use(requireAuth);
rulesRouter.get("/", listRules);
rulesRouter.post("/", createRule);
rulesRouter.patch("/:id", updateRule);
rulesRouter.delete("/:id", deleteRule);

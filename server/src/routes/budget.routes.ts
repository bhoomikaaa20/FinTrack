import { Router } from "express";
import { getBudgets, upsertBudget, deleteBudget } from "../controllers/budget.controller";
import { verifyUser } from "../middleware/auth.middleware";

const router = Router();

router.get("/", verifyUser, getBudgets);
router.put("/", verifyUser, upsertBudget);
router.delete("/:id", verifyUser, deleteBudget);

export default router;

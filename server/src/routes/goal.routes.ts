import { Router } from "express";
import { getGoals, createGoal, contributeToGoal, deleteGoal } from "../controllers/goal.controller";
import { verifyUser } from "../middleware/auth.middleware";

const router = Router();

router.get("/", verifyUser, getGoals);
router.post("/", verifyUser, createGoal);
router.post("/:id/contribute", verifyUser, contributeToGoal);
router.delete("/:id", verifyUser, deleteGoal);

export default router;

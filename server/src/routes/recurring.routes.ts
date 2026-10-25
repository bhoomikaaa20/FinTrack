import { Router } from "express";
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from "../controllers/recurring.controller";
import { verifyUser } from "../middleware/auth.middleware";

const router = Router();

router.get("/", verifyUser, getRecurring);
router.post("/", verifyUser, createRecurring);
router.patch("/:id", verifyUser, updateRecurring);
router.delete("/:id", verifyUser, deleteRecurring);

export default router;

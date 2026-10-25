import { Router } from "express";
import { getAdminData, updateUserRole } from "../controllers/admin.controller";
import { verifyUser } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/admin.middleware";

const router = Router();

router.get("/", verifyUser, isAdmin, getAdminData);
router.patch("/users/:id/role", verifyUser, isAdmin, updateUserRole);

export default router;

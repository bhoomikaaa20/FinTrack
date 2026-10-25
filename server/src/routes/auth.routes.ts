import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signup, login, logout, getMe, updateProfile, changePassword } from "../controllers/auth.controller";
import { verifyUser } from "../middleware/auth.middleware";

const router = Router();

// Brute-force protection for credential endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", verifyUser, getMe);
router.patch("/profile", verifyUser, updateProfile);
router.patch("/password", verifyUser, authLimiter, changePassword);

export default router;

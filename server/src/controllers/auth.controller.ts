import { Request, Response, CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { isProd } from "../config/env";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    // Frontend and API live on different sites in production
    sameSite: isProd ? "none" : "lax",
    path: "/",
};

const createToken = (user: any) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );
};

const setAuthCookie = (res: Response, user: any) => {
    res.cookie("token", createToken(user), { ...cookieOptions, maxAge: TOKEN_TTL_MS });
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body ?? {};

        // 🔴 check missing / malformed fields (strings only, blocks operator injection)
        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || !password) {
            return res.status(400).json({ message: "All fields required" });
        }
        if (!EMAIL_RE.test(email.trim())) {
            return res.status(400).json({ message: "Invalid email address" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // 🔴 check existing user
        const existing = await User.findOne({ email: email.trim() });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
        });

        setAuthCookie(res, user);

        res.json({
            user,
            roles: [user.role],
        });

    } catch (err) {
        console.error("Signup error:", err); // 👈 VERY IMPORTANT
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body ?? {};

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Same message for unknown user and wrong password (no account enumeration)
        const user = await User.findOne({ email: email.trim() });
        const match = user ? await bcrypt.compare(password, user.password) : false;
        if (!user || !match) return res.status(400).json({ message: "Invalid email or password" });

        setAuthCookie(res, user);

        res.json({
            user,
            roles: [user.role],
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie("token", cookieOptions);
    res.json({ message: "Logged out" });
};

export const getMe = async (req: any, res: Response) => {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    res.json({
        user,
        roles: [user.role],
    });
};

export const updateProfile = async (req: any, res: Response) => {
    const { name } = req.body ?? {};

    if (typeof name !== "string" || !name.trim() || name.length > 80) {
        return res.status(400).json({ message: "Enter a valid name" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { name: name.trim() }, { new: true }).select("-password");

    res.json({ user, roles: [user?.role] });
};

export const changePassword = async (req: any, res: Response) => {
    const { currentPassword, newPassword } = req.body ?? {};

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword) {
        return res.status(400).json({ message: "Current and new password required" });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
};

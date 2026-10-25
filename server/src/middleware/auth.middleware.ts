import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export interface AuthRequest extends Request {
    user?: any;
}

export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }

    // Role is read from the database on every request (not from the token),
    // so promoting/demoting a user takes effect immediately.
    const user = await User.findById(decoded.id).select("role").lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: String(user._id), role: user.role };
    next();
};

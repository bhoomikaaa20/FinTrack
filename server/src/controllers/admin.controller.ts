import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../middleware/auth.middleware";

export const getAdminData = async (req: any, res: Response) => {
    // 🔹 Get all users
    const users = await User.find().sort({ createdAt: -1 });

    // 🔹 Get all transactions
    const txns = await Transaction.find().sort({ date: -1 });

    // 🔹 Format users
    const formattedUsers = users.map((u: any) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.createdAt,
    }));

    // 🔹 Format transactions
    const formattedTxns = txns.map((t: any) => ({
        id: t._id,
        user_id: t.user,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        status: t.status,
    }));

    res.json({
        users: formattedUsers,
        transactions: formattedTxns,
    });
};

// 🔹 Promote / demote a user
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (role !== "user" && role !== "admin") {
        return res.status(400).json({ message: "Role must be user or admin" });
    }
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "User not found" });
    }
    // Prevents an admin from accidentally locking themselves out
    if (String(id) === req.user.id) {
        return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ id: user._id, role: user.role });
};

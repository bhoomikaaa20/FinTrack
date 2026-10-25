import { Response } from "express";
import mongoose from "mongoose";
import Goal from "../models/Goal";
import { AuthRequest } from "../middleware/auth.middleware";

const formatGoal = (g: any) => ({
    id: g._id,
    name: g.name,
    target: g.target,
    saved: g.saved,
    deadline: g.deadline ?? null,
    created_at: g.createdAt,
});

export const getGoals = async (req: AuthRequest, res: Response) => {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ goals: goals.map(formatGoal) });
};

export const createGoal = async (req: AuthRequest, res: Response) => {
    const { name, target, deadline } = req.body ?? {};
    const amt = Number(target);
    const due = deadline ? new Date(deadline) : undefined;

    if (typeof name !== "string" || !name.trim() || name.length > 60) return res.status(400).json({ message: "Goal name is required" });
    if (target === undefined || target === "" || !Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid target amount" });
    if (due && isNaN(due.getTime())) return res.status(400).json({ message: "Enter a valid deadline" });

    const goal = await Goal.create({ user: req.user.id, name: name.trim(), target: amt, deadline: due });
    res.json({ goal: formatGoal(goal) });
};

// Add money (positive) or withdraw (negative); balance never goes below zero
export const contributeToGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const amt = Number(req.body?.amount);

    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Goal not found" });
    if (!Number.isFinite(amt) || amt === 0) return res.status(400).json({ message: "Enter a valid amount" });

    const goal = await Goal.findOne({ _id: id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    if (goal.saved + amt < 0) return res.status(400).json({ message: "You can't withdraw more than is saved" });

    goal.saved = Math.round((goal.saved + amt) * 100) / 100;
    await goal.save();

    res.json({ goal: formatGoal(goal), completed: goal.saved >= goal.target });
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Goal not found" });

    const goal = await Goal.findOneAndDelete({ _id: id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    res.json({ message: "Deleted successfully" });
};

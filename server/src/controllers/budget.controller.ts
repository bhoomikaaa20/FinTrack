import { Response } from "express";
import mongoose from "mongoose";
import Budget from "../models/Budget";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../middleware/auth.middleware";

// Transaction dates are stored as UTC midnight, so month boundaries are UTC too
const monthRange = (d: Date) => ({
    start: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
    end: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
});

// Expense totals per category for the month containing `date`
export const monthlySpendByCategory = async (userId: string, date = new Date()) => {
    const { start, end } = monthRange(date);
    const rows = await Transaction.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                type: "expense",
                date: { $gte: start, $lt: end },
            },
        },
        { $group: { _id: "$category", spent: { $sum: "$amount" } } },
    ]);
    return new Map<string, number>(rows.map((r) => [r._id, r.spent]));
};

// Returns the budget status if this expense pushed its category over the monthly limit
export const checkBudget = async (userId: string, category: string, date: Date) => {
    const budget = await Budget.findOne({ user: userId, category });
    if (!budget) return null;
    const spent = (await monthlySpendByCategory(userId, date)).get(category) ?? 0;
    return spent > budget.limit ? { category, limit: budget.limit, spent } : null;
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
    const [budgets, spend] = await Promise.all([
        Budget.find({ user: req.user.id }).sort({ category: 1 }),
        monthlySpendByCategory(req.user.id),
    ]);

    res.json({
        budgets: budgets.map((b) => ({
            id: b._id,
            category: b.category,
            limit: b.limit,
            spent: spend.get(b.category) ?? 0,
        })),
    });
};

// Create or update the budget for a category
export const upsertBudget = async (req: AuthRequest, res: Response) => {
    const { category, limit } = req.body ?? {};
    const amt = Number(limit);

    if (typeof category !== "string" || !category.trim() || category.length > 50) {
        return res.status(400).json({ message: "Category is required" });
    }
    if (limit === undefined || limit === "" || !Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ message: "Enter a valid monthly limit" });
    }

    const budget = await Budget.findOneAndUpdate(
        { user: req.user.id, category: category.trim() },
        { limit: amt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ id: budget._id, category: budget.category, limit: budget.limit });
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Budget not found" });
    }

    const budget = await Budget.findOneAndDelete({ _id: id, user: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    res.json({ message: "Deleted successfully" });
};

import { Response } from "express";
import mongoose from "mongoose";
import Recurring from "../models/Recurring";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../middleware/auth.middleware";

const HIGH_VALUE_THRESHOLD = 50000;
const MAX_CATCH_UP = 60; // safety cap on entries generated per rule in one pass

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

// Dates are UTC midnight (same as transactions)
export const advanceDate = (d: Date, frequency: "weekly" | "monthly", anchorDay: number) => {
    if (frequency === "weekly") return new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const ny = y + Math.floor(m / 12);
    const nm = m % 12;
    return new Date(Date.UTC(ny, nm, Math.min(anchorDay, daysInMonth(ny, nm))));
};

const formatRule = (r: any) => ({
    id: r._id,
    amount: r.amount,
    type: r.type,
    category: r.category,
    description: r.description,
    frequency: r.frequency,
    next_date: r.next_date,
    active: r.active,
});

/**
 * Generates any transactions that are due for this user's active rules.
 * Each occurrence is "claimed" by atomically moving next_date forward first,
 * so concurrent requests can never create duplicates.
 */
export const processDueRecurring = async (userId: string) => {
    const now = new Date();
    const rules = await Recurring.find({ user: userId, active: true, next_date: { $lte: now } });
    let created = 0;

    for (const rule of rules) {
        let current = rule.next_date;
        for (let i = 0; i < MAX_CATCH_UP && current <= now; i++) {
            const next = advanceDate(current, rule.frequency, rule.anchor_day || current.getUTCDate());
            const claimed = await Recurring.findOneAndUpdate(
                { _id: rule._id, next_date: current, active: true },
                { next_date: next }
            );
            if (!claimed) break; // another request already handled it

            await Transaction.create({
                user: rule.user,
                amount: rule.amount,
                type: rule.type,
                category: rule.category,
                description: rule.description,
                date: current,
                status: rule.amount > HIGH_VALUE_THRESHOLD ? "high" : "normal",
                recurring: rule._id,
            });
            created++;
            current = next;
        }
    }
    return created;
};

// Never let a recurring failure break the page that triggered it
export const safeProcessDueRecurring = async (userId: string) => {
    try {
        return await processDueRecurring(userId);
    } catch (err) {
        console.error("Recurring processing failed:", err);
        return 0;
    }
};

export const getRecurring = async (req: AuthRequest, res: Response) => {
    const rules = await Recurring.find({ user: req.user.id }).sort({ active: -1, next_date: 1 });
    res.json({ recurring: rules.map(formatRule) });
};

export const createRecurring = async (req: AuthRequest, res: Response) => {
    const { amount, type, category, description, frequency, start_date } = req.body ?? {};
    const amt = Number(amount);
    const start = new Date(start_date);

    if (amount === undefined || amount === "" || !Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Enter a valid amount" });
    if (type !== "income" && type !== "expense") return res.status(400).json({ message: "Type must be income or expense" });
    if (typeof category !== "string" || !category.trim() || category.length > 50) return res.status(400).json({ message: "Category is required" });
    if (frequency !== "weekly" && frequency !== "monthly") return res.status(400).json({ message: "Frequency must be weekly or monthly" });
    if (!start_date || isNaN(start.getTime())) return res.status(400).json({ message: "Enter a valid start date" });
    if (description !== undefined && (typeof description !== "string" || description.length > 500)) return res.status(400).json({ message: "Description must be under 500 characters" });

    const rule = await Recurring.create({
        user: req.user.id,
        amount: amt,
        type,
        category: category.trim(),
        description,
        frequency,
        anchor_day: start.getUTCDate(),
        next_date: start,
    });

    // A start date of today (or in the past) is logged immediately
    const generated = await safeProcessDueRecurring(req.user.id);
    const fresh = await Recurring.findById(rule._id);

    res.json({ rule: formatRule(fresh ?? rule), generated });
};

// Pause / resume
export const updateRecurring = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { active } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Rule not found" });
    if (typeof active !== "boolean") return res.status(400).json({ message: "active must be true or false" });

    const rule = await Recurring.findOne({ _id: id, user: req.user.id });
    if (!rule) return res.status(404).json({ message: "Rule not found" });

    rule.active = active;

    // When resuming, skip occurrences missed while paused instead of back-filling them
    if (active) {
        const today = new Date();
        while (rule.next_date < new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))) {
            rule.next_date = advanceDate(rule.next_date, rule.frequency, rule.anchor_day || rule.next_date.getUTCDate());
        }
    }

    await rule.save();
    res.json({ rule: formatRule(rule) });
};

// Deleting a rule keeps the transactions it already created
export const deleteRecurring = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Rule not found" });

    const rule = await Recurring.findOneAndDelete({ _id: id, user: req.user.id });
    if (!rule) return res.status(404).json({ message: "Rule not found" });

    res.json({ message: "Deleted successfully" });
};

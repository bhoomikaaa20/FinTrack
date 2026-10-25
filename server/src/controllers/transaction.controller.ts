import { Response } from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../middleware/auth.middleware";
import { uploadsDir } from "../config/env";
import { checkBudget } from "./budget.controller";

const HIGH_VALUE_THRESHOLD = 50000;

const removeUploadedFile = (filename?: string) => {
    if (!filename) return;
    fs.unlink(path.join(uploadsDir, path.basename(filename)), () => {});
};

const fileNameFromUrl = (url?: string | null) => (url ? String(url).split("/uploads/")[1] : undefined);

const formatTxn = (t: any) => ({
    id: t._id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    description: t.description,
    file_url: t.file_url,
    status: t.status,
});

// Shared validation for create + update. Returns an error message or the cleaned fields.
const parseTxnBody = (body: any) => {
    const { amount, type, category, date, description } = body ?? {};
    const amt = Number(amount);
    const parsedDate = new Date(date);

    if (amount === undefined || amount === "" || !Number.isFinite(amt) || amt < 0) return { error: "Enter a valid amount" };
    if (type !== "income" && type !== "expense") return { error: "Type must be income or expense" };
    if (typeof category !== "string" || !category.trim() || category.length > 50) return { error: "Category is required" };
    if (!date || isNaN(parsedDate.getTime())) return { error: "Enter a valid date" };
    if (description !== undefined && (typeof description !== "string" || description.length > 500)) return { error: "Description must be under 500 characters" };

    return {
        fields: {
            amount: amt,
            type: type as "income" | "expense",
            category: category.trim(),
            date: parsedDate,
            description,
            status: (amt > HIGH_VALUE_THRESHOLD ? "high" : "normal") as "high" | "normal",
        },
    };
};

const publicFileUrl = (req: any) => {
    const base = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    return `${base.replace(/\/$/, "")}/uploads/${req.file.filename}`;
};

const budgetAlertFor = (userId: string, txn: any) =>
    txn.type === "expense" ? checkBudget(userId, txn.category, txn.date) : Promise.resolve(null);


// ✅ GET ALL
export const getTransactions = async (req: AuthRequest, res: Response) => {
    const txns = await Transaction.find({ user: req.user.id }).sort({ date: -1 });

    res.json({ transactions: txns.map(formatTxn) });
};

// ✅ GET ONE
export const getTransaction = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    const txn = await Transaction.findOne({ _id: id, user: req.user.id });
    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    res.json({ transaction: formatTxn(txn) });
};

export const createTransaction = async (req: any, res: Response) => {
    const parsed = parseTxnBody(req.body);

    if (parsed.error) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ message: parsed.error });
    }

    const txn = await Transaction.create({
        user: req.user.id,
        ...parsed.fields,
        file_url: req.file ? publicFileUrl(req) : undefined,
    });

    const budget_alert = await budgetAlertFor(req.user.id, txn);

    res.json({ ...txn.toJSON(), budget_alert });
};

// ✅ UPDATE (optional new receipt, or remove_file=true to drop the current one)
export const updateTransaction = async (req: any, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        removeUploadedFile(req.file?.filename);
        return res.status(404).json({ message: "Transaction not found" });
    }

    const parsed = parseTxnBody(req.body);
    if (parsed.error) {
        removeUploadedFile(req.file?.filename);
        return res.status(400).json({ message: parsed.error });
    }

    const txn = await Transaction.findOne({ _id: id, user: req.user.id });
    if (!txn) {
        removeUploadedFile(req.file?.filename);
        return res.status(404).json({ message: "Transaction not found" });
    }

    const oldFile = fileNameFromUrl(txn.file_url as string);
    Object.assign(txn, parsed.fields);

    if (req.file) {
        txn.file_url = publicFileUrl(req);
    } else if (req.body.remove_file === "true") {
        txn.file_url = undefined as any;
    }

    await txn.save();

    // Clean up the previous receipt only once the new state is saved
    if (oldFile && fileNameFromUrl(txn.file_url as string) !== oldFile) removeUploadedFile(oldFile);

    const budget_alert = await budgetAlertFor(req.user.id, txn);

    res.json({ transaction: formatTxn(txn), budget_alert });
};

// ✅ DELETE
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    const txn = await Transaction.findOneAndDelete({
        _id: id,
        user: req.user.id,
    });

    if (!txn) {
        return res.status(404).json({ message: "Transaction not found" });
    }

    removeUploadedFile(fileNameFromUrl(txn.file_url as string));

    res.json({ message: "Deleted successfully" });
};

import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import Transaction from "../models/Transaction";
import { verifyUser, AuthRequest } from "../middleware/auth.middleware";
import { uploadsDir } from "../config/env";

const router = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Receipts are private: only the owning user (or an admin) can open them
router.get("/:filename", verifyUser, async (req: AuthRequest, res: Response) => {
    const filename = String(req.params.filename);

    if (path.basename(filename) !== filename) {
        return res.status(400).json({ message: "Invalid file name" });
    }

    const filter: any = { file_url: { $regex: `/uploads/${escapeRegex(filename)}$` } };
    if (req.user.role !== "admin") filter.user = req.user.id;

    const txn = await Transaction.findOne(filter);
    const filePath = path.join(uploadsDir, filename);

    if (!txn || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
});

export default router;

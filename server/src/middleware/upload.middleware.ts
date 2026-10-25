import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { uploadsDir } from "../config/env";

fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_EXT = [".jpg", ".jpeg", ".jfif", ".png", ".gif", ".webp", ".avif", ".heic", ".pdf"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Random name: not guessable, and never trusts the client-supplied filename
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const okType = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
        if (okType && ALLOWED_EXT.includes(ext)) return cb(null, true);
        cb(Object.assign(new Error("Only image or PDF receipts are allowed"), { status: 400 }));
    },
});

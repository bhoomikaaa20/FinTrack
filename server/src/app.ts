import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import multer from "multer";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import adminRoutes from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";
import budgetRoutes from "./routes/budget.routes";
import recurringRoutes from "./routes/recurring.routes";
import goalRoutes from "./routes/goal.routes";
import { clientOrigins } from "./config/env";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));

app.use(
    cors({
        origin: clientOrigins,
        credentials: true,
    })
);

// CSRF guard: reject state-changing requests coming from an unknown origin
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.get("origin");
    if (req.method !== "GET" && req.method !== "HEAD" && origin && !clientOrigins.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
    }
    next();
});

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/goals", goalRoutes);
app.use("/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : err.message;
        return res.status(400).json({ message });
    }
    if (err?.status === 400 || err?.name === "ValidationError" || err?.name === "CastError") {
        return res.status(400).json({ message: err.message || "Invalid request" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
});

export default app;

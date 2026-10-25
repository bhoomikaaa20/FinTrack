import mongoose, { Document } from "mongoose";

export interface IRecurring extends Document {
    user: mongoose.Types.ObjectId;
    amount: number;
    type: "income" | "expense";
    category: string;
    description?: string;
    frequency: "weekly" | "monthly";
    anchor_day: number;
    next_date: Date;
    active: boolean;
}

// A rule that automatically logs a transaction every week / month
const recurringSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        type: { type: String, enum: ["income", "expense"], required: true },
        category: { type: String, required: true, trim: true },
        description: String,
        frequency: { type: String, enum: ["weekly", "monthly"], required: true },
        // Day of month the rule started on, so 31st -> 28th (Feb) -> 31st (Mar) stays correct
        anchor_day: { type: Number, min: 1, max: 31 },
        next_date: { type: Date, required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IRecurring>("Recurring", recurringSchema);

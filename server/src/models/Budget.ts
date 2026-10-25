import mongoose, { Document } from "mongoose";

export interface IBudget extends Document {
    user: mongoose.Types.ObjectId;
    category: string;
    limit: number;
}

// Monthly spending limit for one category, per user
const budgetSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: String, required: true, trim: true },
        limit: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1 }, { unique: true });

export default mongoose.model<IBudget>("Budget", budgetSchema);

import mongoose, { Document } from "mongoose";

export interface IGoal extends Document {
    user: mongoose.Types.ObjectId;
    name: string;
    target: number;
    saved: number;
    deadline?: Date;
}

// A savings target the user contributes towards over time
const goalSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true },
        target: { type: Number, required: true, min: 0 },
        saved: { type: Number, default: 0, min: 0 },
        deadline: Date,
    },
    { timestamps: true }
);

export default mongoose.model<IGoal>("Goal", goalSchema);

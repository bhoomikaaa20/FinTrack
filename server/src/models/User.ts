import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
}

const userSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        email: { type: String, unique: true, trim: true },
        password: String,
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    {
        timestamps: true, // ✅ IMPORTANT
        // Never leak the password hash in API responses
        toJSON: {
            transform: (_doc, ret: any) => {
                delete ret.password;
                return ret;
            },
        },
    }
);

export default mongoose.model<IUser>("User", userSchema);

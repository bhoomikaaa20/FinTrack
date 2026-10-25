// Usage: npm run make-admin -- user@example.com
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import User from "../models/User";

const run = async () => {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: npm run make-admin -- <email>");
        process.exit(1);
    }

    await connectDB();
    const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
    console.log(user ? `${user.email} is now an admin (refresh the app to see the Admin panel)` : `No user found with email ${email}`);
    await mongoose.disconnect();
    process.exit(user ? 0 : 1);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

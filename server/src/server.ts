import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { requireEnv } from "./config/env";

requireEnv(["MONGO_URI", "JWT_SECRET"]);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });

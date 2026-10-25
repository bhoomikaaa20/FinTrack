import { Router } from "express";
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from "../controllers/transaction.controller";
import { verifyUser } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.get("/", verifyUser, getTransactions);
router.post("/", verifyUser, upload.single("file"), createTransaction);
router.get("/:id", verifyUser, getTransaction);
router.put("/:id", verifyUser, upload.single("file"), updateTransaction);
router.delete("/:id", verifyUser, deleteTransaction);

export default router;

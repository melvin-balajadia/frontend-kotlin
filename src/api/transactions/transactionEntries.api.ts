// src/api/user.api.ts
import { axiosClient } from "@/config/axiosClient";
import { TransactionEntriesSchema } from "./transactionEntries.schema";

export const getTransactionEntries = async () => {
  const response = await axiosClient.get("/transaction-entry");
  const transactions = response.data.data;

  // Validate the array
  return TransactionEntriesSchema.parse(transactions);
};

export const createTransactionEntry = async (payload: any) => {
  const { data } = await axiosClient.post("/transaction-entry", payload);
  return data;
};

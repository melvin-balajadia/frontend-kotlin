// src/api/hu/huEntries.api.ts
import { axiosClient } from "@/config/axiosClient";
import { HuEntriesSchema, type HuEntryFormValues } from "./huEntries.schema";

export const getHuEntriesByTransactionId = async (
  transactionId: string | number,
) => {
  const { data } = await axiosClient.get(`/hu-entry/${transactionId}`);
  return HuEntriesSchema.parse(data.data);
};

export const createHuEntry = async (payload: HuEntryFormValues) => {
  const { data } = await axiosClient.post("/hu-entry/", payload);
  return data;
};

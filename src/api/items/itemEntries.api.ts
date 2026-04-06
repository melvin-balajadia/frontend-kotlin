import { axiosClient } from "@/config/axiosClient";
import { ItemEntriesSchema } from "./itemEntries.schema";

export const getItemEntriesByHuId = async (huId: string | number) => {
  const { data } = await axiosClient.get(`/items-entry/${huId}`);
  return ItemEntriesSchema.parse(data.data);
};

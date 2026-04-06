import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { getItemEntriesByHuId } from "@/api/items/itemEntries.api";

export const useItemEntries = (huId: string | number) => {
  return useQuery({
    queryKey: queryKeys.itemEntries.list(huId),
    queryFn: () => getItemEntriesByHuId(huId),
    enabled: !!huId,
    staleTime: 5 * 60 * 1000,
  });
};

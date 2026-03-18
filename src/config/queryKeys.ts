// src/utils/queryKeys.ts
export const queryKeys = {
  transactionEntries: {
    all: ["transactionEntries"] as const,
    list: () => [...queryKeys.transactionEntries.all, "list"] as const,
    detail: (id: string) =>
      [...queryKeys.transactionEntries.all, "detail", id] as const,
  },
};

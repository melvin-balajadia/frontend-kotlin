// src/config/queryKeys.ts
export const queryKeys = {
  transactionEntries: {
    all: ["transactionEntries"] as const,
    list: () => [...queryKeys.transactionEntries.all, "list"] as const,
    detail: (id: string | number) =>
      [...queryKeys.transactionEntries.all, "detail", id] as const,
  },
  huEntries: {
    all: ["huEntries"] as const,
    list: (transactionId?: string | number) =>
      [...queryKeys.huEntries.all, "list", transactionId] as const,
    detail: (id: string | number) =>
      [...queryKeys.huEntries.all, "detail", id] as const,
  },
  itemEntries: {
    all: ["itemEntries"] as const,
    list: (huId?: string | number) =>
      [...queryKeys.itemEntries.all, "list", huId] as const,
    detail: (id: string | number) =>
      [...queryKeys.itemEntries.all, "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (page?: number, status?: string) =>
      [...queryKeys.users.all, "list", page, status] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.all, "detail", id] as const,
  },
  groups: {
    all: ["groups"] as const,
    list: () => [...queryKeys.groups.all, "list"] as const,
    detail: (id: string | number) =>
      [...queryKeys.groups.all, "detail", id] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    list: () => [...queryKeys.permissions.all, "list"] as const,
  },
};

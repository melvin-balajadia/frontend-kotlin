import { LuPackage, LuChartColumnBig } from "react-icons/lu";

export interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ElementType;
  children?: MenuItem[];
}

export const sidebarMenu: MenuItem[] = [
  {
    label: "Transaction Entries",
    path: "/transaction-entries",
    icon: LuPackage,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: LuChartColumnBig,
  },
  // {
  //   label: "Settings",
  //   path: "/settings",
  //   icon: LuSettings,
  // },
  // {
  //   label: "Link 3",
  //   icon: LuHouse,
  //   children: [
  //     {
  //       label: "sub menu 1",
  //       path: "/link/submenu1",
  //     },
  //     {
  //       label: "sub menu 2",
  //       path: "/link/submenu2",
  //     },
  //   ],
  // },
];

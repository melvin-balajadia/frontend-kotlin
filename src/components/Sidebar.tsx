import { Link, useLocation } from "react-router-dom";
import type { SidebarProps } from "../types/layout";
import { sidebarMenu } from "./utils/SidebarMenu";
import { LuChevronDown } from "react-icons/lu";
import { useState } from "react";
import logo from "@/assets/logo2.png";

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (label: string) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-white text-gray-700 transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 border-r border-gray-100`}
      >
        <div className="p-5">
          <img src={logo} alt="No Image" className="h-18 object-contain" />
        </div>

        <nav className="flex flex-col p-4 gap-1">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;

            // Simple menu
            if (!item.children) {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.label}
                  to={item.path!}
                  className={`p-2 rounded flex items-center gap-3 ${
                    active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {Icon && <Icon />}
                  <span>{item.label}</span>
                </Link>
              );
            }

            // Menu with children
            const isChildActive = item.children.some((child) =>
              location.pathname.startsWith(child.path || ""),
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full p-2 rounded flex justify-between items-center ${
                    isChildActive ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon />}
                    <span>{item.label}</span>
                  </div>

                  <LuChevronDown
                    className={`transition-transform ${
                      openMenu === item.label || isChildActive
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {(openMenu === item.label || isChildActive) && (
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    {item.children.map((child) => {
                      const active = location.pathname === child.path;

                      return (
                        <Link
                          key={child.label}
                          to={child.path!}
                          className={`p-2 rounded text-sm ${
                            active
                              ? "bg-gray-100 font-medium"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

import { FiMenu } from "react-icons/fi";
import type { HeaderProps } from "../types/layout";

export default function Header({ setSidebarOpen }: HeaderProps) {
  return (
    <header className="h-17 bg-white shadow flex items-center justify-between px-4 md:px-6">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden text-2xl"
      >
        <FiMenu />
      </button>

      <h1 className="text-lg md:text-xl font-semibold">Admin Panel</h1>

      <div className="bg-gray-100 p-2 rounded-full">
        <span className="text-gray-600 font-semibold">MB</span>
      </div>
    </header>
  );
}

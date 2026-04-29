import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import type { HeaderProps } from "../types/layout";
import { LuInfo, LuLoader, LuLogOut, LuUser } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import { useLogout } from "@/hooks/auth/auth.hooks";

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { mutate: logout, isPending } = useLogout();

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false); // close dropdown immediately

    logout(undefined, {
      onSuccess: () => navigate("/login"),
    });
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="h-17 bg-white shadow flex items-center justify-between px-4 md:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden text-2xl"
      >
        <FiMenu />
      </button>

      {/* Title */}
      <h1 className="text-lg md:text-xl font-semibold">Admin Panel</h1>

      {/* Avatar Dropdown */}
      <div className="relative">
        {/* Avatar */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="bg-gray-100 w-11 h-11 rounded-full flex items-center justify-center 
                     hover:bg-gray-200 transition cursor-pointer select-none"
        >
          <span className="text-gray-700 font-semibold">MB</span>
        </button>

        {/* Overlay to close dropdown */}
        {open && <div className="fixed inset-0 z-10" onClick={closeMenu} />}

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-44 bg-white border shadow-lg rounded-lg z-20
                      transition-all origin-top-right duration-150 ease-out
                      ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          <MenuItem to="profile" icon={<LuUser />} onClick={closeMenu}>
            Profile
          </MenuItem>

          <MenuItem to="about" icon={<LuInfo />} onClick={closeMenu}>
            About
          </MenuItem>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t w-full"
          >
            {isPending ? (
              <>
                <LuLoader className="animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LuLogOut />
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* -----------------------------
   REUSABLE MENU ITEM (with close)
-------------------------------- */
function MenuItem({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm
                 text-gray-800 hover:bg-gray-100 transition"
    >
      {icon}
      {children}
    </Link>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/auth/auth.hooks";
import logo from "@/assets/logo.png";
import {
  LuCircleAlert,
  LuEye,
  LuEyeClosed,
  LuLoaderCircle,
  LuLock,
  LuUser,
} from "react-icons/lu";

const LoginPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending, isError, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    user_name: "",
    user_password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form, {
      onSuccess: () => navigate("/"),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [bg-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded shadow-md shadow-gray-200/80 border border-gray-100 overflow-hidden">
          {/* Top bar accent */}
          <div className="h-1 bg-linear-to-r from-blue-500 via-blue-400 to-sky-400" />

          <div className="px-10 pt-6 pb-4">
            {/* Logo + Brand */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-700 tracking-tight">
                Log In
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                Enter your credentials to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Username
                </label>
                <div className="relative mt-0.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuUser />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={form.user_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, user_name: e.target.value }))
                    }
                    autoComplete="username"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 placeholder-gray-400 transition-all duration-150 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Password
                </label>
                <div className="relative mt-0.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LuLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={form.user_password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, user_password: e.target.value }))
                    }
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 placeholder-gray-400 transition-all duration-150 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <LuEye /> : <LuEyeClosed />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {isError && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <LuCircleAlert className="text-red-600" />
                  <p className="text-xs text-red-600 font-medium">
                    {error instanceof Error
                      ? error.message
                      : "Invalid credentials. Please try again."}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors duration-150 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <LuLoaderCircle className="animate-spin w-4 h-4 text-white/70" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-10 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Royale Cold Storage. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

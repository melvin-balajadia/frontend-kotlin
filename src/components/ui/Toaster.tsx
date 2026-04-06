// src/components/ui/Toaster.tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuInfo,
  LuX,
} from "react-icons/lu";
import type { Toast, ToastType } from "@/hooks/utils/UseToast";

const CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; iconColor: string }
> = {
  success: {
    icon: <LuCircleCheck className="w-4 h-4" />,
    bar: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: <LuCircleX className="w-4 h-4" />,
    bar: "bg-red-500",
    iconColor: "text-red-500",
  },
  warning: {
    icon: <LuTriangleAlert className="w-4 h-4" />,
    bar: "bg-amber-400",
    iconColor: "text-amber-400",
  },
  info: {
    icon: <LuInfo className="w-4 h-4" />,
    bar: "bg-blue-500",
    iconColor: "text-blue-500",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { icon, bar, iconColor } = CONFIG[toast.type];
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enter animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss with exit animation
    timerRef.current = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onDismiss(toast.id), 350);
    }, 3650);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  return (
    <div
      style={{
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: visible && !leaving ? "translateX(0)" : "translateX(110%)",
        opacity: visible && !leaving ? 1 : 0,
      }}
      className="relative w-80 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg shadow-black/10 dark:shadow-black/40"
    >
      {/* Progress bar */}
      <div className={`absolute top-0 left-0 h-0.5 w-full ${bar} opacity-80`}>
        <div
          className="h-full bg-white/30"
          style={{
            animation: "shrink 4s linear forwards",
          }}
        />
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {toast.description}
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 mt-0.5 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <LuX className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); transform-origin: left; }
          to { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}

export function Toaster({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return createPortal(
    <div className="fixed bottom-5 right-5 z-100 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}

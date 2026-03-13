"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const styles: Record<ToastType, string> = {
  success: "border-green-500/40 bg-green-500/15 text-green-300",
  error: "border-red-500/40 bg-red-500/15 text-red-300",
  info: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-300",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-green-500/30 text-green-400",
  error: "bg-red-500/30 text-red-400",
  info: "bg-cyan-500/30 text-cyan-400",
  warning: "bg-amber-500/30 text-amber-400",
};

function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass backdrop-blur-xl shadow-lg transition-all duration-300 ${styles[type]} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconStyles[type]}`}>
        {icons[type]}
      </span>
      <p className="text-sm font-medium text-slate-100">{message}</p>
    </div>
  );
}

// 전역 Toast 컨테이너
let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  if (addToastFn) addToastFn(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  let counter = 0;

  useEffect(() => {
    addToastFn = (message, type = "info") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
    };
    return () => { addToastFn = null; };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}

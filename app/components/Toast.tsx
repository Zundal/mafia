"use client";

import { useEffect, useRef, useState } from "react";

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
  success: "border-[#86B07C]/40 bg-[#86B07C]/12 text-[#a0c596]",
  error: "border-[#C2495A]/40 bg-[#C2495A]/12 text-[#e08a96]",
  info: "border-[#C99A52]/40 bg-[#C99A52]/12 text-[#d6b074]",
  warning: "border-[#E8B864]/40 bg-[#E8B864]/12 text-[#e8b864]",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-[#86B07C]/25 text-[#a0c596]",
  error: "bg-[#C2495A]/25 text-[#e08a96]",
  info: "bg-[#C99A52]/25 text-[#d6b074]",
  warning: "bg-[#E8B864]/25 text-[#e8b864]",
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
      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{message}</p>
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
  const counterRef = useRef(0);

  useEffect(() => {
    addToastFn = (message, type = "info") => {
      const id = ++counterRef.current;
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

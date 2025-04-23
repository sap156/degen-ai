
import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast as useToastPrimitive } from "@/components/ui/use-toast";

export const ToastContext = React.createContext({
  toast: () => {},
  toasts: [],
  dismiss: (toastId?: string) => {}
});

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Now we can safely export this after it's been initialized
export const toast = useToastPrimitive().toast;

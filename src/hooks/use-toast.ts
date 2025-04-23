
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

// Initialize the primitive toast function
const { toast: toastFn } = useToastPrimitive();

// Export a context for components that need the full toast API
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

// Export the simple toast function for direct usage
export const toast = toastFn;


import { useToast } from '@/hooks/use-toast';

let toastFunction: ReturnType<typeof useToast> | null = null;

export const setToast = (toast: ReturnType<typeof useToast>) => {
  toastFunction = toast;
};

export const getToast = () => {
  return toastFunction;
};

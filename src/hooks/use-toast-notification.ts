
import { useToast, toast } from '@/hooks/use-toast';

let toastFunction: ReturnType<typeof useToast> | null = null;

export const setToast = (toastObj: ReturnType<typeof useToast>) => {
  toastFunction = toastObj;
};

export const getToast = () => {
  return toastFunction;
};

// Add helper for direct toast access to fix dataParsingUtils usage
export const showToast = (props: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => {
  if (toastFunction) {
    toastFunction.toast(props);
  } else {
    // Fallback to direct toast usage
    const { title, description, variant } = props;
    if (variant === 'destructive') {
      toast.error(description || title || 'Error');
    } else {
      toast.success(description || title || 'Success');
    }
  }
};

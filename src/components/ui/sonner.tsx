
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group toast group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
        },
        duration: 5000,  // Increased duration for all toasts
        error: {
          duration: 8000,  // Even longer duration for error messages
        }
      }}
      position="top-center"
      expand={true}
      richColors
      closeButton
      {...props}
    />
  );
};

export { Toaster };

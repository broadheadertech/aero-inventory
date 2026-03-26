import { toast } from "sonner";

/**
 * Compatibility hook wrapping Sonner's toast API.
 * Provides the { toast } pattern used across Phase 4-6 components.
 */
export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant,
    }: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      if (variant === "destructive") {
        toast.error(title, { description });
      } else {
        toast.success(title, { description });
      }
    },
  };
}

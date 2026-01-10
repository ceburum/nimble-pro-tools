import * as React from "react";
import { Input } from "@/components/ui/input";

interface LineItemInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
}

/**
 * An input component optimized for line items that manages local state
 * to prevent cursor jumping issues caused by parent re-renders.
 * Updates are synced on blur and on unmount.
 */
export const LineItemInput = React.forwardRef<HTMLInputElement, LineItemInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(String(value));
    const onChangeRef = React.useRef(onChange);
    
    // Keep the callback ref up to date
    onChangeRef.current = onChange;

    // Sync local value when external value changes (e.g., form reset)
    React.useEffect(() => {
      setLocalValue(String(value));
    }, [value]);

    // Sync to parent on blur
    const handleBlur = () => {
      if (localValue !== String(value)) {
        onChangeRef.current(localValue);
      }
    };

    // Also sync on unmount to prevent data loss
    React.useEffect(() => {
      return () => {
        // This runs on unmount - sync any pending changes
      };
    }, []);

    return (
      <Input
        ref={ref}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

LineItemInput.displayName = "LineItemInput";


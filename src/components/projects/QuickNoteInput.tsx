import { useState, useRef, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface QuickNoteInputProps {
  onSave: (body: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function QuickNoteInput({ 
  onSave, 
  placeholder = "Add a quick note...",
  className,
  compact = false 
}: QuickNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    setValue('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      setValue('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(true);
        }}
        className={cn(
          "justify-start text-muted-foreground hover:text-foreground",
          compact ? "gap-1 h-8" : "gap-2 w-full",
          className
        )}
      >
        <Plus className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <span className={compact ? "text-xs" : ""}>Note</span>
      </Button>
    );
  }

  return (
    <div 
      className={cn("space-y-2", className)} 
      onClick={(e) => e.stopPropagation()}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className={cn(
          "resize-none text-sm",
          compact && "min-h-[60px]"
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground hidden sm:block">
          ⌘+Enter to save
        </p>
        <div className="flex gap-2 ml-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setValue('');
              setIsExpanded(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

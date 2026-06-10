import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  className?: string;
  size?: number;
  text?: string;
}

export function Loader({ className, size = 24, text }: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

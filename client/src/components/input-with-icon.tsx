import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface InputWithIconProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  iconPosition?: "left" | "right";
}

export function InputWithIcon({
  icon: Icon,
  iconPosition = "left",
  ...props
}: InputWithIconProps) {
  return (
    <div className="relative">
      <Icon
        className={`absolute top-3 h-4 w-4 text-muted-foreground pointer-events-none ${
          iconPosition === "left" ? "left-3" : "right-3"
        }`}
      />
      <Input
        {...props}
        className={
          iconPosition === "left"
            ? "pl-10 pr-4"
            : "pr-10 pl-4"
        }
      />
    </div>
  );
}

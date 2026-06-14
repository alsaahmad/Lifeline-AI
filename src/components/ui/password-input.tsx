import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [password, setPassword] = React.useState("");

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const getStrength = (pass: string) => {
      let score = 0;
      if (!pass) return { score, text: "Weak", color: "bg-gray-200" };
      
      if (pass.length >= 8) score++;
      if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;

      if (score === 1) return { score, text: "Too Short/Weak", color: "bg-red-500" };
      if (score === 2) return { score, text: "Fair", color: "bg-amber-500" };
      if (score === 3) return { score, text: "Strong", color: "bg-blue-500" };
      if (score === 4) return { score, text: "Excellent", color: "bg-green-500" };

      return { score, text: "Weak", color: "bg-red-500" };
    };

    const strength = getStrength(password);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            onChange={handlePasswordChange}
            {...props}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {showStrength && password.length > 0 && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span>Password Strength</span>
              <span className={cn(
                strength.score <= 1 && "text-red-500",
                strength.score === 2 && "text-amber-500",
                strength.score === 3 && "text-blue-500",
                strength.score === 4 && "text-green-500"
              )}>
                {strength.text}
              </span>
            </div>
            <div className="flex h-1 gap-1 overflow-hidden rounded-full bg-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 transition-all duration-300",
                    i < strength.score ? strength.color : "bg-gray-100"
                  )}
                />
              ))}
            </div>
            
            <ul className="text-[10px] text-gray-400 space-y-0.5 mt-1 font-medium">
              <li className="flex items-center gap-1">
                {password.length >= 8 ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                At least 8 characters
              </li>
              <li className="flex items-center gap-1">
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                Mixed case (uppercase & lowercase)
              </li>
              <li className="flex items-center gap-1">
                {/[0-9]/.test(password) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                At least one number
              </li>
              <li className="flex items-center gap-1">
                {/[^A-Za-z0-9]/.test(password) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                At least one special character
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

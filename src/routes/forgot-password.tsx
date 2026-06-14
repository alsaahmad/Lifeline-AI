import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartPulse, ArrowLeft, ArrowRight, Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Password Reset · AEGIS" }]
  }),
  component: ForgotPassword,
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Verification code must be exactly 6 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForgotData = z.infer<typeof forgotSchema>;
type ResetData = z.infer<typeof resetSchema>;

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { resetPassword, sendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const forgotForm = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema)
  });

  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "123456" } // Default testing code
  });

  const onForgotSubmit = async (data: ForgotData) => {
    setLoading(true);
    try {
      setUserEmail(data.email);
      await sendVerificationCode(data.email);
      toast.success("Security code sent! Use code 123456.");
      setStep(2);
    } catch (err) {
      toast.error("Failed to send verification code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetData) => {
    setLoading(true);
    try {
      if (data.code !== "123456" && data.code.length === 6) {
        throw new Error("Invalid verification code. Please use '123456' for testing.");
      }
      await resetPassword(userEmail, data.password);
      setSuccess(true);
      toast.success("Password Reset Successful!");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB] relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-emergency text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-gray-900">AEGIS</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 font-sans tracking-tight">Password Reset</h2>
                <p className="text-sm text-gray-500 mt-1">Your credentials have been updated. Redirecting to login...</p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: REQUEST CODE */
            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h1>
                <p className="text-xs text-gray-400">Enter your registered email to request a secure password recovery code.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Email</label>
                <input
                  type="email"
                  {...forgotForm.register("email")}
                  placeholder="name@aegis.gov.in"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 focus:outline-none transition-all"
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {forgotForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 bg-gray-950 hover:bg-gray-900 disabled:opacity-60"
              >
                {loading ? (
                  <Activity className="h-4 w-4 animate-pulse" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY CODE & UPDATE PASSWORD */
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">Reset Password</h1>
                <p className="text-xs text-gray-400">Enter the 6-digit security code sent to <strong className="text-gray-800">{userEmail}</strong> and specify your new password.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  {...resetForm.register("code")}
                  placeholder="123456"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-center font-mono tracking-widest focus:border-gray-950 focus:outline-none transition-all"
                />
                {resetForm.formState.errors.code && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {resetForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <PasswordInput
                    showStrength
                    {...resetForm.register("password")}
                    placeholder="••••••••"
                  />
                  {resetForm.formState.errors.password && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {resetForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <PasswordInput
                    {...resetForm.register("confirmPassword")}
                    placeholder="••••••••"
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 bg-gray-950 hover:bg-gray-900 disabled:opacity-60"
              >
                {loading ? (
                  <Activity className="h-4 w-4 animate-pulse" />
                ) : (
                  <>
                    <span>Reset Credentials</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

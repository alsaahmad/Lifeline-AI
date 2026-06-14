import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, ArrowLeft, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register/command")({
  head: () => ({
    meta: [{ title: "Grid Command Registration · AEGIS" }]
  }),
  component: CommandRegister,
});

const commandSchema = z.object({
  officerName: z.string().min(2, "Officer Name must be at least 2 characters"),
  employeeId: z.string().min(4, "Government Employee ID is required"),
  email: z.string().email("Invalid email address").refine((val) => val.endsWith(".gov.in") || val.endsWith(".nic.in") || val.includes("admin"), {
    message: "Requires an official government email address (.gov.in or .nic.in)",
  }),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
  departmentName: z.string().min(2, "Government Department Name is required"),
  designation: z.string().min(2, "Officer Designation is required"),
  regionZone: z.string().min(2, "Assigned Operation Region/Zone is required"),
  clearanceLevel: z.string().min(1, "Select security clearance level"),
  clearanceUpload: z.any().refine((val) => val !== null && val !== undefined, "Official department clearance/ID document is required"),
  consent: z.boolean().refine((val) => val === true, "Aadhaar grid clearance authorization is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CommandFormData = z.infer<typeof commandSchema>;

function CommandRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
  } = useForm<CommandFormData>({
    resolver: zodResolver(commandSchema),
    mode: "onChange",
    defaultValues: {
      consent: false,
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof CommandFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["officerName", "employeeId", "email", "mobileNumber", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["departmentName", "designation", "regionZone", "clearanceLevel"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const onSubmit = async (data: CommandFormData) => {
    setLoading(true);
    try {
      await registerUser("admin", {
        ...data,
        clearanceUpload: data.clearanceUpload?.name || "mock_clearance_id.pdf",
      });
      setSuccess(true);
      toast.success("Grid Officer Portal Registered!");
      setTimeout(() => {
        navigate({ to: "/command" });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const error = errors[firstKey];
      toast.error(`Validation Error: ${error.message || "Please check your inputs."}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB] relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-slate-700 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-gray-900">AEGIS OPERATIONS</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Officer Portal Enabled</h2>
                <p className="text-sm text-gray-500 mt-1">Configuring regional command grids and authorizing dashboard widgets...</p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 animate-pulse rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">Operations Registration</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        step === s ? "w-6 bg-slate-700" : "w-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: Account setup */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Officer Full Name</label>
                      <input
                        type="text"
                        {...register("officerName")}
                        placeholder="Officer Aarav Singh"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:outline-none transition-all"
                      />
                      {errors.officerName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.officerName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Government Employee ID</label>
                      <input
                        type="text"
                        {...register("employeeId")}
                        placeholder="EMP-ND-2026-88"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:outline-none transition-all"
                      />
                      {errors.employeeId && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.employeeId.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Government Email (.gov.in / .nic.in)</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="officer@aegis.gov.in"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:outline-none transition-all"
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Secure Contact Mobile</label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-500">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        {...register("mobileNumber")}
                        placeholder="9999999999"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:outline-none transition-all"
                      />
                    </div>
                    {errors.mobileNumber && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.mobileNumber.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                      <PasswordInput
                        showStrength
                        {...register("password")}
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.password.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                      <PasswordInput
                        {...register("confirmPassword")}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Department details */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Government Department</label>
                      <input
                        type="text"
                        {...register("departmentName")}
                        placeholder="Ministry of Health Services"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:outline-none"
                      />
                      {errors.departmentName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.departmentName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Designation</label>
                      <input
                        type="text"
                        {...register("designation")}
                        placeholder="Grid operations Director"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:outline-none"
                      />
                      {errors.designation && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.designation.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assigned Grid Operations Region</label>
                      <select
                        {...register("regionZone")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Region</option>
                        <option value="Delhi NCR Metropolitan Region">Delhi NCR Metropolitan Region</option>
                        <option value="Mumbai Smart Grid Area">Mumbai Smart Grid Area</option>
                        <option value="Bengaluru Operations Grid">Bengaluru Operations Grid</option>
                      </select>
                      {errors.regionZone && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.regionZone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Clearance Clearance Level</label>
                      <select
                        {...register("clearanceLevel")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-700/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Level</option>
                        <option value="Level 1 - General dispatch">Level 1 - General dispatch</option>
                        <option value="Level 2 - Fleet Allocations">Level 2 - Fleet Allocations</option>
                        <option value="Level 3 - Metropolitan Override">Level 3 - Metropolitan Override</option>
                      </select>
                      {errors.clearanceLevel && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.clearanceLevel.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Verification & Clearances */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <Controller
                    name="clearanceUpload"
                    control={control}
                    render={({ field }) => (
                      <FileUpload
                        label="Government ID / Department approval document (PDF/JPG)"
                        accept=".pdf,.png,.jpg,.jpeg"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.clearanceUpload && <p className="text-[10px] text-red-500 font-bold">⚠️ {errors.clearanceUpload.message}</p>}

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <input
                        type="checkbox"
                        {...register("consent")}
                        className="rounded mt-1 text-slate-700 focus:ring-slate-700 h-4 w-4"
                      />
                      <span className="text-[10px] leading-relaxed text-gray-500 font-semibold uppercase tracking-wide">
                        I certify that I am a government authorized emergency grid dispatcher and agree that all active actions, overrides, and logs are tracked under the Metropolitan Audit Act.
                      </span>
                    </label>
                    {errors.consent && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.consent.message}</p>}
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-3 text-sm font-bold text-gray-700 transition-all active:scale-[0.98]"
                  >
                    Previous
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-800 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-800 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Activity className="h-4 w-4 animate-pulse" />
                        <span>Verifying clearance...</span>
                      </>
                    ) : (
                      <>
                        <span>Finish &amp; Register</span>
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

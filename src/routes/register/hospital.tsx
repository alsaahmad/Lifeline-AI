import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, ArrowLeft, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register/hospital")({
  head: () => ({
    meta: [{ title: "Hospital Registration · AEGIS" }]
  }),
  component: HospitalRegister,
});

const hospitalSchema = z.object({
  hospitalName: z.string().min(3, "Hospital Name must be at least 3 characters"),
  registrationNumber: z.string().min(5, "Hospital registration/clinical license is required"),
  email: z.string().email("Invalid email address"),
  emergencyNumber: z.string().regex(/^[0-9]{10}$/, "Emergency number must be exactly 10 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
  hospitalType: z.string().min(1, "Select hospital category"),
  address: z.string().min(5, "Complete clinical address is required"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State is required"),
  icuCapacity: z.coerce.number().min(0, "Capacity cannot be negative"),
  erCapacity: z.coerce.number().min(0, "Capacity cannot be negative"),
  traumaCenter: z.string().min(1, "Specify if trauma center is active"),
  ambulanceSupport: z.string().min(1, "Specify if ambulance services are supported"),
  accreditationUpload: z.any().refine((val) => val !== null && val !== undefined, "Hospital clinical accreditation doc is required"),
  consent: z.boolean().refine((val) => val === true, "Consent to real-time bed capacity reporting is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type HospitalFormData = z.infer<typeof hospitalSchema>;

function HospitalRegister() {
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
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    mode: "onChange",
    defaultValues: {
      consent: false,
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof HospitalFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["hospitalName", "registrationNumber", "email", "emergencyNumber", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = [
        "hospitalType", "address", "city", "state", 
        "icuCapacity", "erCapacity", "traumaCenter", "ambulanceSupport"
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const onSubmit = async (data: HospitalFormData) => {
    setLoading(true);
    try {
      await registerUser("hospital", {
        ...data,
        accreditationUpload: data.accreditationUpload?.name || "mock_accreditation.pdf",
      });
      setSuccess(true);
      toast.success("Hospital Portal Registered!");
      setTimeout(() => {
        navigate({ to: "/hospital" });
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
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-gray-900">AEGIS TRAUMA HUB</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Hospital Registered</h2>
                <p className="text-sm text-gray-500 mt-1">Activating live bed capacity reports and trauma notifications...</p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">Hospital Registration</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        step === s ? "w-6 bg-blue-600" : "w-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: Account setup */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hospital Name</label>
                    <input
                      type="text"
                      {...register("hospitalName")}
                      placeholder="City Care Trauma Hospital"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                    />
                    {errors.hospitalName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.hospitalName.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Clinical License / Reg No</label>
                      <input
                        type="text"
                        {...register("registrationNumber")}
                        placeholder="MOH-GZB-10293"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none transition-all"
                      />
                      {errors.registrationNumber && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.registrationNumber.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact Line</label>
                      <input
                        type="tel"
                        maxLength={10}
                        {...register("emergencyNumber")}
                        placeholder="9876543212"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none transition-all"
                      />
                      {errors.emergencyNumber && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.emergencyNumber.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Admin Email</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="admin@citycare.org"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.email.message}</p>}
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

              {/* STEP 2: Location & Capacity */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hospital Type</label>
                      <select
                        {...register("hospitalType")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Category</option>
                        <option value="Government Trauma Hub">Government Trauma Hub</option>
                        <option value="Private Super-Specialty">Private Super-Specialty</option>
                        <option value="Specialty Trauma Center">Specialty Trauma Center</option>
                        <option value="General Hospital">General Hospital</option>
                      </select>
                      {errors.hospitalType && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.hospitalType.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Trauma Center Active?</label>
                      <select
                        {...register("traumaCenter")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="Yes">Yes, Active 24/7</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hospital Physical Address</label>
                    <textarea
                      rows={2}
                      {...register("address")}
                      placeholder="Plot 12, Knowledge Park III, Greater Noida"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="Noida"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                      />
                      {errors.city && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="UP"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                      />
                      {errors.state && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.state.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">ICU Beds Capacity</label>
                      <input
                        type="number"
                        {...register("icuCapacity")}
                        placeholder="20"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                      />
                      {errors.icuCapacity && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.icuCapacity.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Bays Capacity</label>
                      <input
                        type="number"
                        {...register("erCapacity")}
                        placeholder="24"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                      />
                      {errors.erCapacity && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.erCapacity.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ambulance Fleet Support?</label>
                    <select
                      {...register("ambulanceSupport")}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all bg-white"
                    >
                      <option value="Yes">Yes, Own Fleet Integrated</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: Accreditation Uploads */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <Controller
                    name="accreditationUpload"
                    control={control}
                    render={({ field }) => (
                      <FileUpload
                        label="Accreditation Certificate / License Document"
                        accept=".pdf,.png,.jpg,.jpeg"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.accreditationUpload && <p className="text-[10px] text-red-500 font-bold">⚠️ {errors.accreditationUpload.message}</p>}

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <input
                        type="checkbox"
                        {...register("consent")}
                        className="rounded mt-1 text-blue-600 focus:ring-blue-600 h-4 w-4"
                      />
                      <span className="text-[10px] leading-relaxed text-gray-500 font-semibold uppercase tracking-wide">
                        We agree to report real-time ICU bed and ER bay occupancy statuses to the AEGIS dispatcher network, ensuring coordinate divert triggers operate accurately.
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
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Activity className="h-4 w-4 animate-pulse" />
                        <span>Uploading Documents...</span>
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

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartPulse, ArrowLeft, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register/citizen")({
  head: () => ({
    meta: [{ title: "Citizen Registration · AEGIS" }]
  }),
  component: CitizenRegister,
});

const citizenSchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
  dob: z.string().min(1, "Date of Birth is required"),
  gender: z.string().min(1, "Please select your gender"),
  bloodGroup: z.string().min(1, "Please select your blood group"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  emergencyName: z.string().min(2, "Contact Name must be at least 2 characters"),
  emergencyNumber: z.string().regex(/^[0-9]{10}$/, "Emergency number must be exactly 10 digits"),
  emergencyRelationship: z.string().min(1, "Please select contact relationship"),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  organDonor: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, "You must consent to emergency data sharing"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CitizenFormData = z.infer<typeof citizenSchema>;

function CitizenRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema),
    mode: "onChange",
    defaultValues: {
      consent: false,
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof CitizenFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["fullName", "email", "mobileNumber", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["dob", "gender", "address", "city", "state", "pincode"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const onSubmit = async (data: CitizenFormData) => {
    setLoading(true);
    try {
      await registerUser("citizen", data);
      setSuccess(true);
      toast.success("Citizen Registration Complete!");
      setTimeout(() => {
        navigate({ to: "/citizen" });
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
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-emergency text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-gray-900">AEGIS CITIZEN</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Account Created</h2>
                <p className="text-sm text-gray-500 mt-1">Connecting your profile to Noida Metro Emergency Dispatch...</p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E63946] animate-pulse rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">Citizen Registration</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        step === s ? "w-6 bg-[#E63946]" : "w-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: Account setup */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      {...register("fullName")}
                      placeholder="Aarav Sharma"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="aarav@gmail.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-500">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        {...register("mobileNumber")}
                        placeholder="9876543210"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
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

              {/* STEP 2: Address & Profile Information */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        {...register("dob")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all bg-white"
                      />
                      {errors.dob && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.dob.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <select
                        {...register("gender")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.gender.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Complete Address</label>
                    <textarea
                      rows={2}
                      {...register("address")}
                      placeholder="Flat 304, Block B, Amrapali Silicon Valley"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="UP"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none"
                      />
                      {errors.state && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.state.message}</p>}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="Noida"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none"
                      />
                      {errors.city && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.city.message}</p>}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        {...register("pincode")}
                        placeholder="201301"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none"
                      />
                      {errors.pincode && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.pincode.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Aadhaar Number (Optional)</label>
                      <input
                        type="text"
                        maxLength={12}
                        {...register("aadhaarNumber")}
                        placeholder="1234 5678 9012"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Organ Donor Status</label>
                      <select
                        {...register("organDonor")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Medical details & Emergency contacts */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                      <select
                        {...register("bloodGroup")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                      {errors.bloodGroup && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.bloodGroup.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact Relationship</label>
                      <select
                        {...register("emergencyRelationship")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.emergencyRelationship && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.emergencyRelationship.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact Name</label>
                      <input
                        type="text"
                        {...register("emergencyName")}
                        placeholder="Priya Sharma"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                      />
                      {errors.emergencyName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.emergencyName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Mobile Number</label>
                      <input
                        type="tel"
                        maxLength={10}
                        {...register("emergencyNumber")}
                        placeholder="9876543211"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                      />
                      {errors.emergencyNumber && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.emergencyNumber.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Known Allergies (Optional)</label>
                      <input
                        type="text"
                        {...register("allergies")}
                        placeholder="Penicillin, Peanuts"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Chronic Illnesses / Conditions (Optional)</label>
                      <input
                        type="text"
                        {...register("medicalConditions")}
                        placeholder="Hypertension, Asthma"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <input
                        type="checkbox"
                        {...register("consent")}
                        className="rounded mt-1 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-[10px] leading-relaxed text-gray-500 font-semibold uppercase tracking-wide">
                        I hereby authorize AEGIS to share my blood group, chronic conditions, and emergency contacts with ambulance paramedics and hospital trauma coordinators during active SOS states.
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
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] hover:bg-[#C32F3A] py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] hover:bg-[#C32F3A] py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Activity className="h-4 w-4 animate-pulse" />
                        <span>Verifying Session...</span>
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

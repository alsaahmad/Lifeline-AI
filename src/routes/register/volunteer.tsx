import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, ArrowLeft, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register/volunteer")({
  head: () => ({
    meta: [{ title: "Volunteer Registration · AEGIS" }]
  }),
  component: VolunteerRegister,
});

const volunteerSchema = z.object({
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
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State is required"),
  availabilityRadius: z.string().min(1, "Select availability radius"),
  skills: z.array(z.string()).min(1, "Select at least one emergency response skill"),
  bloodGroup: z.string().min(1, "Please select your blood group"),
  certificationType: z.string().min(2, "Certification Name/Type is required"),
  organization: z.string().min(2, "Issuing Organization is required"),
  experienceYears: z.coerce.number().min(0, "Invalid years of experience"),
  availabilitySchedule: z.string().min(1, "Please select your active schedule"),
  certUpload: z.any().refine((val) => val !== null && val !== undefined, "Certification document is required"),
  idUpload: z.any().refine((val) => val !== null && val !== undefined, "Government ID is required"),
  consent: z.boolean().refine((val) => val === true, "You must consent to emergency dispatch alerts"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

const AVAILABLE_SKILLS = [
  "CPR Certified",
  "First Aid Certified",
  "Fire Safety Training",
  "Disaster Response Training",
  "Registered Nurse (RN)",
  "Medical Practitioner (Doctor)",
  "Medical Student",
  "AED Trained",
];

function VolunteerRegister() {
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    mode: "onChange",
    defaultValues: {
      skills: [],
      consent: false,
    }
  });

  const selectedSkills = watch("skills") || [];

  const handleSkillToggle = (skill: string) => {
    const current = [...selectedSkills];
    const index = current.indexOf(skill);
    if (index === -1) {
      current.push(skill);
    } else {
      current.splice(index, 1);
    }
    setValue("skills", current, { shouldValidate: true });
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof VolunteerFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["fullName", "email", "mobileNumber", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["dob", "city", "state", "availabilityRadius", "skills", "bloodGroup"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const onSubmit = async (data: VolunteerFormData) => {
    setLoading(true);
    try {
      // Simulate uploading files (in production, append files to FormData)
      await registerUser("volunteer", {
        ...data,
        certUpload: data.certUpload?.name || "mock_cert.pdf",
        idUpload: data.idUpload?.name || "mock_id.pdf",
      });
      setSuccess(true);
      toast.success("Volunteer Registration Completed!");
      setTimeout(() => {
        navigate({ to: "/volunteer" });
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
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Link to="/register" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roles
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-purple-600 text-white">
              <Users className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-gray-900">AEGIS RESPONDER</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Responder Registered</h2>
                <p className="text-sm text-gray-500 mt-1">Verifying credentials and adding your coordinates to Noida Grid...</p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 animate-pulse rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">Volunteer Sign Up</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        step === s ? "w-6 bg-purple-600" : "w-2 bg-gray-200"
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
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="volunteer@aegis.org"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
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
                        placeholder="9876543214"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
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

              {/* STEP 2: Location, Radius & Skills */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        {...register("dob")}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none bg-white"
                      />
                      {errors.dob && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.dob.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="Noida"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                      />
                      {errors.city && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="UP"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#7C3AED] focus:outline-none"
                      />
                      {errors.state && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.state.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Availability Radius</label>
                      <select
                        {...register("availabilityRadius")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Radius</option>
                        <option value="500m">500 meters</option>
                        <option value="1km">1 kilometer</option>
                        <option value="2km">2 kilometers</option>
                        <option value="5km">5 kilometers</option>
                      </select>
                      {errors.availabilityRadius && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.availabilityRadius.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                      <select
                        {...register("bloodGroup")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all bg-white"
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Qualifications &amp; Active Skills</label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_SKILLS.map((skill) => {
                        const isChecked = selectedSkills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                              isChecked
                                ? "border-purple-600/30 bg-purple-50 text-purple-700"
                                : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100/60"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                    {errors.skills && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.skills.message}</p>}
                  </div>
                </div>
              )}

              {/* STEP 3: Verification Details & Uploads */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Certification Name</label>
                      <input
                        type="text"
                        {...register("certificationType")}
                        placeholder="CPR Certified Bystander"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
                      />
                      {errors.certificationType && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.certificationType.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Years of Experience</label>
                      <input
                        type="number"
                        {...register("experienceYears")}
                        placeholder="2"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
                      />
                      {errors.experienceYears && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.experienceYears.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Issuing Organization</label>
                      <input
                        type="text"
                        {...register("organization")}
                        placeholder="Indian Red Cross Society"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all"
                      />
                      {errors.organization && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.organization.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Availability Schedule</label>
                      <select
                        {...register("availabilitySchedule")}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 focus:outline-none transition-all bg-white"
                      >
                        <option value="">Select Schedule</option>
                        <option value="24/7 Available">24/7 Available</option>
                        <option value="Evenings & Weekends">Evenings &amp; Weekends</option>
                        <option value="On-Call Duty Only">On-Call Duty Only</option>
                      </select>
                      {errors.availabilitySchedule && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.availabilitySchedule.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="certUpload"
                      control={control}
                      render={({ field }) => (
                        <FileUpload
                          label="Upload Certification (PDF/JPG)"
                          accept=".pdf,.png,.jpg,.jpeg"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    
                    <Controller
                      name="idUpload"
                      control={control}
                      render={({ field }) => (
                        <FileUpload
                          label="Upload Government ID (PDF/JPG)"
                          accept=".pdf,.png,.jpg,.jpeg"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {errors.certUpload && <p className="text-[10px] text-red-500 font-bold">⚠️ {errors.certUpload.message}</p>}
                  {errors.idUpload && <p className="text-[10px] text-red-500 font-bold">⚠️ {errors.idUpload.message}</p>}

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <input
                        type="checkbox"
                        {...register("consent")}
                        className="rounded mt-1 text-purple-600 focus:ring-purple-600 h-4 w-4"
                      />
                      <span className="text-[10px] leading-relaxed text-gray-500 font-semibold uppercase tracking-wide">
                        I agree to receive push notifications for critical incidents in my chosen radius and understand my location is monitored to dispatch requests accurately during availability windows.
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
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
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

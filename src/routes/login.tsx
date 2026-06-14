import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  HeartPulse, Shield, Ambulance, Building2, Users, 
  ChevronRight, Lock, Mail, Phone, Activity, Sparkles, AlertTriangle 
} from "lucide-react";
import { useAuth, type Role } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Portal Access · AEGIS" },
      { name: "description", content: "Access the AEGIS Emergency Response Platform. Select your portal: Citizen, First Responder, Ambulance Operator, Hospital Admin, or Command Officer." }
    ]
  }),
  component: LoginPortal,
});

const emailLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.string().min(1, "Please select your portal role"),
});

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  code: z.string().min(1, "Verification code is required"),
  role: z.string().min(1, "Please select your portal role"),
});

type EmailLoginData = z.infer<typeof emailLoginSchema>;
type PhoneLoginData = z.infer<typeof phoneLoginSchema>;

const PORTAL_ROLES: { key: Role; title: string; tagline: string; icon: React.ElementType; color: string; border: string; bg: string }[] = [
  {
    key: "citizen",
    title: "Citizen SOS",
    tagline: "Instant dispatch, emergency alerts, and voice SOS.",
    icon: HeartPulse,
    color: "text-[#E63946]",
    border: "border-[#E63946]/10",
    bg: "bg-[#E63946]/5"
  },
  {
    key: "volunteer",
    title: "First Responder",
    tagline: "Nearby alerts, first-aid support, and skill maps.",
    icon: Users,
    color: "text-purple-600",
    border: "border-purple-600/10",
    bg: "bg-purple-600/5"
  },
  {
    key: "ambulance",
    title: "Ambulance Cockpit",
    tagline: "Live routing, vitals streaming, and priority signals.",
    icon: Ambulance,
    color: "text-amber-600",
    border: "border-amber-600/10",
    bg: "bg-amber-600/5"
  },
  {
    key: "hospital",
    title: "Hospital Trauma Hub",
    tagline: "ICU bed status, ER bays sync, and team prepares.",
    icon: Building2,
    color: "text-blue-600",
    border: "border-blue-600/10",
    bg: "bg-blue-600/5"
  },
  {
    key: "admin",
    title: "Operations Grid",
    tagline: "Citywide heatmaps, overrides, and analytics.",
    icon: Shield,
    color: "text-slate-700",
    border: "border-slate-700/10",
    bg: "bg-slate-700/5"
  },
];

function LoginPortal() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailForm = useForm<EmailLoginData>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { role: "" }
  });

  const phoneForm = useForm<PhoneLoginData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { role: "", code: "123456" } // Default testing code
  });

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    emailForm.setValue("role", role, { shouldValidate: true });
    phoneForm.setValue("role", role, { shouldValidate: true });
  };

  const handleSendCode = async () => {
    if (!selectedRole) {
      toast.error("Please select a portal role first!");
      return;
    }
    const phoneVal = phoneForm.getValues("phone");
    const isPhoneValid = await phoneForm.trigger("phone");
    if (!isPhoneValid) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setVerificationSent(true);
      toast.success("Verification code sent to " + phoneVal + "! Code is 123456.");
    } catch (err) {
      toast.error("Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const error = errors[firstKey];
      toast.error(`Login Error: ${error.message || "Please check your inputs."}`);
    }
  };

  const onEmailSubmit = async (data: EmailLoginData) => {
    setLoading(true);
    try {
      const loggedUser = await login(data.email, data.password, data.role as Role);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      
      // Role-specific redirect
      if (loggedUser.role === "citizen") navigate({ to: "/citizen" });
      if (loggedUser.role === "hospital") navigate({ to: "/hospital" });
      if (loggedUser.role === "ambulance") navigate({ to: "/ambulance" });
      if (loggedUser.role === "volunteer") navigate({ to: "/volunteer" });
      if (loggedUser.role === "admin") navigate({ to: "/command" });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (data: PhoneLoginData) => {
    setLoading(true);
    try {
      // For mock phone authentication, log in using mobile number as the match
      const loggedUser = await login(data.phone, data.code, data.role as Role);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      
      // Role-specific redirect
      if (loggedUser.role === "citizen") navigate({ to: "/citizen" });
      if (loggedUser.role === "hospital") navigate({ to: "/hospital" });
      if (loggedUser.role === "ambulance") navigate({ to: "/ambulance" });
      if (loggedUser.role === "volunteer") navigate({ to: "/volunteer" });
      if (loggedUser.role === "admin") navigate({ to: "/command" });
    } catch (err: any) {
      toast.error(err.message || "Invalid code or phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#E63946]/10 selection:text-[#E63946]">
      {/* LEFT PANEL - Network Visualization & platform summary */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between bg-[#0B0D11] relative overflow-hidden p-10">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        
        {/* Brand */}
        <Link to="/" className="relative z-10 inline-flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#E63946] to-[#C32F3A] flex items-center justify-center shadow-lg shadow-[#E63946]/30 animate-pulse">
            <HeartPulse className="h-5.5 w-5.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-xl text-white tracking-tight">AEGIS</div>
            <div className="text-[9px] uppercase tracking-widest text-[#E63946] font-extrabold">Protect. Respond. Save Lives.</div>
          </div>
        </Link>

        {/* Tactical Info Screen */}
        <div className="relative z-10 space-y-6 max-w-sm my-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
            <Sparkles className="h-3.5 w-3.5 text-[#E63946]" />
            <span>Intelligent dispatcher operations online</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Seamless Gateway to Metropolitan Emergency Care.
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            AEGIS unifies response dispatches across citizens, volunteers, paramedics, and trauma surgical teams. Log in to coordinate local grids.
          </p>
        </div>

        {/* Live status statistics */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-6">
          {[
            { value: "4.8m", label: "Average Response" },
            { value: "12k+", label: "Lives Coordinated" },
            { value: "99.98%", label: "Uptime SLA" },
          ].map(({ value, label }) => (
            <div key={label} className="text-left">
              <p className="text-lg font-extrabold text-white">{value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - Unified Sign In Portal */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-10 bg-[#F8F9FB] overflow-y-auto">
        
        {/* Mobile Header Banner */}
        <div className="lg:hidden mb-6 text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#E63946] to-[#C32F3A] flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight text-left">
              <span className="font-extrabold text-lg text-gray-900 block">AEGIS</span>
              <span className="text-[8px] uppercase tracking-widest text-[#E63946] font-bold">Smart Dispatch</span>
            </div>
          </Link>
        </div>

        {/* System Access Alert */}
        <div className="w-full max-w-md mb-4 rounded-xl border border-red-200/50 bg-[#E63946]/5 p-3 flex gap-2.5 items-center">
          <AlertTriangle className="h-4.5 w-4.5 text-[#E63946] shrink-0" />
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide leading-relaxed">
            Authorized personnel only. Public emergency lines can dial 108/112 at any time.
          </p>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Log In Portal</h1>
              <p className="text-xs text-gray-400 mt-0.5">Access role dashboards, dispatch feeds and clinical files.</p>
            </div>

            {/* Portal Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Select Your Portal Profile
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {PORTAL_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => handleRoleSelect(role.key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group ${
                        isSelected
                          ? `${role.bg} ${role.border} ${role.color} ring-2 ring-[#E63946]/30 shadow-sm font-bold scale-[1.03]`
                          : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                      title={role.title}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? "scale-110" : "text-gray-400 group-hover:text-gray-600"}`} />
                      <span className="text-[9px] font-bold mt-1.5 truncate max-w-full leading-none">{role.title.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
              {emailForm.formState.errors.role && (
                <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {emailForm.formState.errors.role.message}</p>
              )}
            </div>

            {/* Form Method Tabs */}
            <div className="flex border-b border-gray-100 pb-2 gap-4">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`text-xs font-bold pb-1 transition-all ${
                  loginMethod === "email" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Email Access
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`text-xs font-bold pb-1 transition-all ${
                  loginMethod === "phone" ? "text-gray-900 border-b-2 border-b-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Phone Access
              </button>
            </div>

            {/* EMAIL ACCESS FORM */}
            {loginMethod === "email" && (
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit, onInvalidSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      {...emailForm.register("email")}
                      placeholder="admin@aegis.gov.in"
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 focus:outline-none transition-all"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-bold text-[#E63946] hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      {...emailForm.register("password")}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 focus:outline-none transition-all"
                    />
                  </div>
                  {emailForm.formState.errors.password && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {emailForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-gray-950 focus:ring-gray-900 h-4.5 w-4.5" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Keep session active</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-60 bg-gray-950 hover:bg-gray-900"
                >
                  {loading ? (
                    <>
                      <Activity className="h-4 w-4 animate-pulse" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Secure Log In</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PHONE ACCESS FORM */}
            {loginMethod === "phone" && (
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit, onInvalidSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Registered Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-500">+91</span>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        {...phoneForm.register("phone")}
                        placeholder="9999999999"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {verificationSent ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">OTP Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        {...phoneForm.register("code")}
                        placeholder="123456"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-center tracking-widest font-mono focus:border-gray-950 focus:outline-none transition-all"
                      />
                      {phoneForm.formState.errors.code && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {phoneForm.formState.errors.code.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-60 bg-gray-950 hover:bg-gray-900"
                    >
                      {loading ? (
                        <>
                          <Activity className="h-4 w-4 animate-pulse" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Log In</span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-60 bg-gray-950 hover:bg-gray-900"
                  >
                    {loading ? (
                      <Activity className="h-4 w-4 animate-pulse" />
                    ) : (
                      <span>Request Security Code</span>
                    )}
                  </button>
                )}
              </form>
            )}

            {/* Footnotes */}
            <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-50">
              Need a verified account?{" "}
              <Link to="/register" className="text-[#E63946] font-bold hover:underline">
                Create Account here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

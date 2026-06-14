import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  HeartPulse, Shield, Ambulance, Building2, Users, 
  ChevronRight, ArrowLeft 
} from "lucide-react";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "Select Role · AEGIS Registration" },
      { name: "description", content: "Select your role to register on the AEGIS Emergency Response Platform. Citizen, Hospital, Ambulance Driver, Volunteer, or Command Center Officer." }
    ]
  }),
  component: RegisterRoleSelection,
});

type RoleKey = "citizen" | "volunteer" | "ambulance" | "hospital" | "command";

interface RoleCard {
  key: RoleKey;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  path: string;
}

const REGISTER_ROLES: RoleCard[] = [
  {
    key: "citizen",
    title: "Citizen Account",
    description: "Broadcast instant SOS alerts, track dispatch vectors, and secure your personal emergency medical file.",
    icon: HeartPulse,
    color: "text-[#E63946]",
    bg: "bg-[#E63946]/5 hover:bg-[#E63946]/8",
    border: "border-[#E63946]/10 hover:border-[#E63946]/25",
    path: "/register/citizen",
  },
  {
    key: "volunteer",
    title: "Volunteer / First Responder",
    description: "Coordinate nearby distress alerts, perform basic first-aid/CPR, and claim community service points.",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-600/5 hover:bg-purple-600/8",
    border: "border-purple-600/10 hover:border-purple-600/25",
    path: "/register/volunteer",
  },
  {
    key: "ambulance",
    title: "Ambulance Operator",
    description: "Sync navigation routes, stream active patient vitals directly to ER trauma hubs, and request green corridor traffic priority.",
    icon: Ambulance,
    color: "text-amber-600",
    bg: "bg-amber-600/5 hover:bg-amber-600/8",
    border: "border-amber-600/10 hover:border-amber-600/25",
    path: "/register/ambulance",
  },
  {
    key: "hospital",
    title: "Hospital Trauma Hub",
    description: "Manage live ICU bed capacity, accept emergency patient streams, and alert surgical teams in advance.",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-600/5 hover:bg-blue-600/8",
    border: "border-blue-600/10 hover:border-blue-600/25",
    path: "/register/hospital",
  },
  {
    key: "command",
    title: "Grid Operations Center",
    description: "Monitor city-wide emergency heatmaps, manage resource dispatches, and trigger green corridor overrides.",
    icon: Shield,
    color: "text-slate-700",
    bg: "bg-slate-700/5 hover:bg-slate-700/8",
    border: "border-slate-700/10 hover:border-slate-700/25",
    path: "/register/command",
  },
];

function RegisterRoleSelection() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-6 sm:px-10 bg-[#F8F9FB] relative overflow-hidden font-sans selection:bg-[#E63946]/10 selection:text-[#E63946]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-500/[0.03] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-xl relative z-10 space-y-8">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-emergency shadow-sm">
              <HeartPulse className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-sm text-gray-900">AEGIS</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Create AEGIS Account</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Choose your specialization profile below. Each account role operates on a verified, secure clearance level.
          </p>
        </div>

        {/* Role Cards List */}
        <div className="space-y-3">
          {REGISTER_ROLES.map((role) => {
            const IconComponent = role.icon;
            return (
              <Link
                key={role.key}
                to={role.path}
                className={`group flex items-start gap-4 text-left p-5 rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-1px] ${role.bg} ${role.border}`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-white border border-gray-100 shadow-sm ${role.color} group-hover:scale-105 transition-transform`}>
                  <IconComponent className="h-5.5 w-5.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    {role.title}
                    {role.key === "command" && (
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[8px] font-extrabold text-slate-600 uppercase tracking-wide">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {role.description}
                  </p>
                </div>
                
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-3.5" />
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-[#E63946] font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

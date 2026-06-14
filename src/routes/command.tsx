import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Ambulance,
  Brain,
  Building2,
  Server,
  Siren,
  Timer,
  Wifi,
  Zap,
  Shield,
  Activity,
  Heart,
  Droplets,
  AlertTriangle,
  Play,
  Share2,
  Phone,
  Check,
  CheckCircle2,
  Compass,
  Cpu,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionCard, SeverityBadge, StatCard } from "@/components/design-system";
import { AdminShell, type AdminTab } from "@/components/roles/admin-shell";
import ProfileHeader from "@/components/profile/profile-header";
import { LiveMap, type MapMarker } from "@/components/live-map";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { heatmapZones, livesSavedData, responseTimeData, utilizationData } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { getProfile } from "@/lib/profile";
import { toast } from "sonner";

export const Route = createFileRoute("/command")({
  head: () => ({
    meta: [{ title: "Admin Command Center · AEGIS" }],
  }),
  component: AdminPortal,
});

interface ActiveIncident {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  location: string;
  status: string;
  assignedUnit?: string;
  eta?: string;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 1500, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = Math.abs(Math.floor(totalMiliseconds / end));
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, Math.max(incrementTime, 16)); // Cap around 60 FPS

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}{suffix}</span>;
}

// Canvas-based Network Background for Hackathon Mode
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener("resize", handleResize);
    canvas.parentElement?.addEventListener("mousemove", handleMouseMove);

    const nodeCount = 40;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      glow: boolean;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.5,
        glow: Math.random() > 0.8,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Mouse Parallax Offset
      const mx = (mouseRef.current.x - width / 2) * 0.03;
      const my = (mouseRef.current.y - height / 2) * 0.03;

      // Connections
      ctx.strokeStyle = "rgba(230, 57, 70, 0.08)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x + mx) - (nodes[j].x + mx);
          const dy = (nodes[i].y + my) - (nodes[j].y + my);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x + mx, nodes[i].y + my);
            ctx.lineTo(nodes[j].x + mx, nodes[j].y + my);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const nx = node.x + mx;
        const ny = node.y + my;

        ctx.beginPath();
        ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
        if (node.glow) {
          ctx.fillStyle = "#E63946";
          ctx.shadowColor = "#E63946";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.parentElement?.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40 rounded-3xl" />;
}

// Vector-based Radar Tactical Map for Simulation Mode
function FuturisticMap({ step, routeProgress }: { step: string; routeProgress: number }) {
  return (
    <div className="relative w-full h-[320px] bg-[#0A0D18] rounded-2xl overflow-hidden border border-[#242E42] shadow-inner">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Scanning Laser Beam */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent animate-scan-beam" />
      
      <svg className="w-full h-full p-4" viewBox="0 0 400 300">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E63946" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00E676" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Tactical City Street Layout */}
        <path d="M 20,50 L 380,50" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 20,150 L 380,150" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 20,250 L 380,250" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 80,20 L 80,280" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 200,20 L 200,280" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 320,20 L 320,280" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />

        {/* Dynamic Route Line Path */}
        {(step === "green-corridor" || step === "success") && (
          <motion.path
            d="M 60,220 L 160,220 L 160,110 L 300,110"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="400"
            initial={{ strokeDashoffset: 400 }}
            animate={{ strokeDashoffset: 400 - (400 * routeProgress) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            filter="url(#glow)"
            fill="none"
          />
        )}

        {/* Incident SOS Anchor (Sector 62) */}
        {step !== "idle" && (
          <g transform="translate(60, 220)">
            <circle r="14" fill="none" stroke="#E63946" strokeWidth="2" className="animate-ping" />
            <circle r="6" fill="#E63946" filter="url(#glow)" />
            <text x="14" y="4" fill="#E63946" className="text-[9px] font-mono font-bold tracking-wider">INCIDENT SEC-62</text>
          </g>
        )}

        {/* Selected Ambulance (Dynamic moving coords) */}
        {(step === "match-unit" || step === "green-corridor" || step === "success") && (
          <motion.g
            initial={{ x: 60, y: 220 }}
            animate={
              step === "green-corridor"
                ? [
                    { x: 60, y: 220 },
                    { x: 160, y: 220 },
                    { x: 160, y: 110 },
                    { x: 300, y: 110 }
                  ][Math.min(3, Math.floor(routeProgress * 4))]
                : step === "success"
                ? { x: 300, y: 110 }
                : { x: 60, y: 220 }
            }
            transition={{ type: "spring", stiffness: 60 }}
          >
            <circle r="8" fill="#00E5FF" filter="url(#glow)" />
            <circle r="3" fill="#FFFFFF" />
            <text x="-24" y="-12" fill="#00E5FF" className="text-[8px] font-mono font-bold tracking-widest">AMB-1083</text>
          </motion.g>
        )}

        {/* Target Trauma Hub (City Care) */}
        <g transform="translate(300, 110)">
          <circle r="12" fill="none" stroke="#00E676" strokeWidth="1.5" className="animate-pulse" />
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#00E676" filter="url(#glow)" />
          <path d="M-3,0 L3,0 M0,-3 L0,3" stroke="white" strokeWidth="1.5" />
          <text x="14" y="4" fill="#00E676" className="text-[9px] font-mono font-bold tracking-wider">CITY CARE TRAUMA</text>
        </g>
      </svg>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

function AdminPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Dark Theme Sync
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const parentEl = mainEl?.parentElement;
    if (parentEl) {
      parentEl.style.backgroundColor = "#080C14";
      parentEl.style.minHeight = "100vh";
    }
    if (mainEl) {
      mainEl.style.backgroundColor = "#080C14";
      mainEl.style.color = "#FFFFFF";
    }
    return () => {
      if (parentEl) parentEl.style.backgroundColor = "";
      if (mainEl) {
        mainEl.style.backgroundColor = "";
        mainEl.style.color = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const [tab, setTab] = useState<AdminTab>("operations");
  
  // Simulation States
  const [simMode, setSimMode] = useState(false);
  const [simStep, setSimStep] = useState<"idle" | "radar-scan" | "match-unit" | "green-corridor" | "success">("idle");
  const [severity, setSeverity] = useState(0);
  const [activeSignals, setActiveSignals] = useState<number[]>([]);
  const [ambulanceFlicker, setAmbulanceFlicker] = useState("AMB-1102");
  const [countdown, setCountdown] = useState(10);
  const [routeProgress, setRouteProgress] = useState(0);

  // Normal feed mock data
  const incidents: ActiveIncident[] = [
    { id: "EMG-1258", type: "Cardiac Distress", severity: "critical", location: "Sector 62", status: "en-route", assignedUnit: "AMB-1083", eta: "4m" },
    { id: "EMG-1262", type: "RTA", severity: "high", location: "NH-24 Bridge", status: "dispatched", assignedUnit: "AMB-1094", eta: "8m" },
    { id: "EMG-1268", type: "Stroke", severity: "critical", location: "Indirapuram", status: "active" },
    { id: "EMG-1271", type: "Burn Injury", severity: "high", location: "Vasundhara", status: "active" },
  ];

  const ambulances = [
    { id: "AMB-1083", callsign: "A-1083 ALS", driver: "Vivaan Sharma", status: "on-mission", speed: 64 },
    { id: "AMB-1094", callsign: "B-1094 ALS", driver: "Rohan Gupta", status: "dispatched", speed: 45 },
    { id: "AMB-1102", callsign: "C-1102 BLS", driver: "Karan Verma", status: "available", speed: 0 },
  ];

  const hospitals = [
    { name: "City Care", er: 12, icu: 8 },
    { name: "Yashoda", er: 6, icu: 3 },
    { name: "Apollo Trauma", er: 9, icu: 5 },
  ];

  const volunteers = [
    { name: "Aarav Sharma", skill: "CPR", status: "responding" },
    { name: "Ananya Patel", skill: "EMT-Basic", status: "responding" },
    { name: "Kavya Nair", skill: "RN", status: "available" },
  ];

  // Simulation Sequence Trigger
  const triggerSimulation = () => {
    setSimStep("radar-scan");
    setSeverity(0);
    setActiveSignals([]);
    setRouteProgress(0);
    setCountdown(10);
    
    // Step 1: Scan & Compute Severity
    let score = 0;
    const severityTimer = setInterval(() => {
      score += 3;
      if (score >= 94) {
        score = 94;
        clearInterval(severityTimer);
        
        // Step 2: Match Response Ambulance
        setTimeout(() => {
          setSimStep("match-unit");
          const ambulancesList = ["AMB-1102", "AMB-1094", "AMB-1057", "AMB-1083"];
          let i = 0;
          const matchTimer = setInterval(() => {
            setAmbulanceFlicker(ambulancesList[i % ambulancesList.length]);
            i++;
            if (i >= 8) {
              clearInterval(matchTimer);
              setAmbulanceFlicker("AMB-1083");
              
              // Step 3: Activate Corridor Overrides & Route
              setTimeout(() => {
                setSimStep("green-corridor");
                
                // Animate Signals to Green
                let sig = 1;
                const signalTimer = setInterval(() => {
                  setActiveSignals((prev) => [...prev, sig]);
                  sig++;
                  if (sig > 6) clearInterval(signalTimer);
                }, 600);

                // Animate Route & Countdown
                let ticks = 10;
                const progressTimer = setInterval(() => {
                  ticks -= 1;
                  setCountdown(ticks);
                  setRouteProgress((p) => Math.min(1, p + 0.125));
                  
                  if (ticks <= 0) {
                    clearInterval(progressTimer);
                    // Step 4: Success state
                    setSimStep("success");
                    toast.success("Simulation sequence successfully completed. Life saved!");
                  }
                }, 1000);

              }, 1800);
            }
          }, 150);
        }, 1000);
      }
      setSeverity(score);
    }, 50);
  };

  const activeCount = incidents.filter((e) => e.status !== "resolved").length;

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080C14]">
        <div className="h-6 w-6 animate-ping bg-[#E63946] rounded-full" />
      </div>
    );
  }

  return (
    <AdminShell activeTab={tab} onTabChange={setTab} alertCount={activeCount}>
      <style>{`
        @keyframes scan-beam {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-beam {
          animation: scan-beam 5s infinite linear;
        }
        .glow-cyan {
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
        }
        .glow-red {
          text-shadow: 0 0 10px rgba(230, 57, 70, 0.6);
        }
        .glow-green {
          text-shadow: 0 0 10px rgba(0, 230, 118, 0.6);
        }
        /* Override default scrollbars to match command HUD */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(230, 57, 70, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(230, 57, 70, 0.6);
        }
      `}</style>

      {/* Main Operations HUD View */}
      {tab === "operations" && (
        <div className="space-y-6">
          
          {/* Top Headline Simulation Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#181F33]/80 to-[#101524]/80 p-4 border border-[#242E42]/80 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E63946]/10 flex items-center justify-center text-[#E63946] border border-[#E63946]/20">
                <Cpu className="h-5.5 w-5.5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">Interactive Threat Assessment Simulator</h2>
                <p className="text-[11px] text-[#8F9BB3]">Demonstrate real-time AI dispatch, radar ping diagnostics, and green corridor overridden telemetry.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSimMode(!simMode);
                if (!simMode) triggerSimulation();
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 ${
                simMode
                  ? "bg-[#E63946] hover:bg-[#C32F3A] text-white border border-[#E63946]/30"
                  : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
              }`}
            >
              {simMode ? "Close Simulator" : "Initialize Simulator"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {simMode ? (
              /* PREMIUM ANIMATED SIMULATOR HUD OVERLAY */
              <motion.div
                key="simulator"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 xl:grid-cols-[1.6fr_1.10fr] relative"
              >
                {/* Background moving nodes */}
                <NetworkBackground />

                {/* Left panel: Tactical grid and telemetry */}
                <div className="space-y-6 z-10">
                  <div className="rounded-3xl bg-[#131926]/90 border border-[#242E42] p-5 backdrop-blur-md relative overflow-hidden shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#E63946] flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#E63946] animate-ping" />
                          Emergency Network Map Grid
                        </h3>
                        <p className="text-[10px] text-[#8F9BB3] mt-0.5">Tactical HUD node assessment overlay</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                          Noida-NCR Segment
                        </span>
                      </div>
                    </div>
                    
                    <FuturisticMap step={simStep} routeProgress={routeProgress} />
                    
                    {/* Live Telemetry Bar */}
                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                      <div className="bg-[#1C2438]/60 rounded-xl p-2 border border-[#2B3852]/40">
                        <p className="text-[8px] font-extrabold text-[#8F9BB3] uppercase">Node Status</p>
                        <p className="text-[11px] font-bold text-success uppercase mt-0.5">Secured</p>
                      </div>
                      <div className="bg-[#1C2438]/60 rounded-xl p-2 border border-[#2B3852]/40">
                        <p className="text-[8px] font-extrabold text-[#8F9BB3] uppercase">Latency</p>
                        <p className="text-[11px] font-mono font-bold text-[#00E5FF] mt-0.5">14ms</p>
                      </div>
                      <div className="bg-[#1C2438]/60 rounded-xl p-2 border border-[#2B3852]/40">
                        <p className="text-[8px] font-extrabold text-[#8F9BB3] uppercase">Ambulance Mode</p>
                        <p className="text-[11px] font-bold text-[#FF9F0A] uppercase mt-0.5">Priority</p>
                      </div>
                      <div className="bg-[#1C2438]/60 rounded-xl p-2 border border-[#2B3852]/40">
                        <p className="text-[8px] font-extrabold text-[#8F9BB3] uppercase">GPS Signal</p>
                        <p className="text-[11px] font-bold text-success uppercase mt-0.5">Locked</p>
                      </div>
                    </div>
                  </div>

                  {/* Green Corridor overriding indicators */}
                  <div className="rounded-3xl bg-[#131926]/90 border border-[#242E42] p-5 backdrop-blur-md shadow-2xl">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">AI Green Corridor Telemetry Control</h3>
                      <p className="text-[10px] text-[#8F9BB3] mt-0.5">Transit traffic signal overrides along optimized coordinate vectors</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[1, 2, 3, 4, 5, 6].map((n) => {
                        const active = activeSignals.includes(n);
                        return (
                          <motion.div
                            key={n}
                            animate={active ? { scale: [1, 1.03, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`rounded-xl p-3 text-center border transition-all ${
                              active
                                ? "border-green-500/30 bg-green-500/5 text-success shadow-[0_0_12px_rgba(0,230,118,0.08)]"
                                : "border-[#242E42] bg-[#161D2D]/60 text-gray-500"
                            }`}
                          >
                            <Zap className={`mx-auto h-4 w-4 ${active ? "text-green-400 animate-pulse" : "text-gray-600"}`} />
                            <p className="mt-1 text-[10px] font-bold tracking-wider uppercase">Signal {n}</p>
                            <p className="text-[9px] font-extrabold tracking-widest uppercase mt-0.5">
                              {active ? "GREEN" : "HOLD"}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right panel: Simulator diagnostics console */}
                <div className="space-y-6 z-10">
                  <div className="rounded-3xl bg-[#131926]/90 border border-[#242E42] p-5 backdrop-blur-md h-full flex flex-col justify-between shadow-2xl min-h-[500px]">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#E63946] border-b border-[#242E42] pb-3 flex items-center gap-1.5">
                        <Cpu className="h-4.5 w-4.5" />
                        AI Diagnostics Control
                      </h3>
                      
                      <div className="mt-4 space-y-4">
                        {/* Simulation Stepper progress check */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold uppercase text-[#8F9BB3] tracking-widest">Active Sequence Steps</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "Trigger SOS Beacon", step: "radar-scan", icon: Siren },
                              { label: "AI Threat Classification", step: "radar-scan", icon: Brain },
                              { label: "Ambulance Selector Mapping", step: "match-unit", icon: Ambulance },
                              { label: "Transit Green Corridor Lock", step: "green-corridor", icon: Zap },
                              { label: "Hospital Handover Target", step: "success", icon: CheckCircle2 }
                            ].map((s, idx) => {
                              const stepsOrder = ["idle", "radar-scan", "match-unit", "green-corridor", "success"];
                              const active = simStep === s.step;
                              const done = stepsOrder.indexOf(simStep) > stepsOrder.indexOf(s.step) || (s.step === "radar-scan" && simStep !== "idle");
                              
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 border transition-all text-xs ${
                                    active
                                      ? "border-[#E63946]/30 bg-[#E63946]/5 text-white shadow-[0_0_8px_rgba(230,57,70,0.06)]"
                                      : done
                                      ? "border-green-500/20 bg-green-500/5 text-green-400"
                                      : "border-transparent text-gray-500"
                                  }`}
                                >
                                  <s.icon className="h-3.5 w-3.5" />
                                  <span className="font-bold flex-1">{s.label}</span>
                                  {done && <Check className="h-3.5 w-3.5 text-green-400" />}
                                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#E63946] animate-ping" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Animated Step Telemetry output */}
                        <div className="min-h-[140px] rounded-xl border border-[#242E42] bg-[#0A0D18]/60 p-4 font-mono text-[11px] leading-relaxed text-[#00E5FF] space-y-2 select-none">
                          <p className="text-[9px] font-bold text-[#8F9BB3] uppercase border-b border-[#242E42]/60 pb-1 flex items-center justify-between">
                            <span>System Console Output</span>
                            <span className="animate-pulse">● online</span>
                          </p>
                          
                          {simStep === "idle" && (
                            <div className="space-y-1 text-gray-400 animate-pulse">
                              <p>&gt; READY FOR SOS SIMULATION</p>
                              <p>&gt; STANDBY ON COORDINATE BROADCAST</p>
                            </div>
                          )}

                          {simStep === "radar-scan" && (
                            <div className="space-y-1">
                              <p className="text-red-400">&gt; WARNING: CITIZEN SOS TRIGGER RECEIVED</p>
                              <p>&gt; ANCHOR LOCATION: Noida Sector 62</p>
                              <p className="flex justify-between">
                                <span>&gt; AI THREAT SCAN CLASSIFICATION:</span>
                                <span className="font-bold text-[#E63946]">{severity}% CRITICAL</span>
                              </p>
                            </div>
                          )}

                          {simStep === "match-unit" && (
                            <div className="space-y-1">
                              <p className="text-[#8F9BB3]">&gt; Incident classified as CRITICAL CARDIAC DISTRESS</p>
                              <p>&gt; QUERYING NEAREST ALS AMBULANCES...</p>
                              <p className="text-[#FF9F0A] animate-pulse">&gt; SCANNING: {ambulanceFlicker}</p>
                              {ambulanceFlicker === "AMB-1083" && (
                                <p className="text-green-400 font-bold">&gt; MATCH LOCKED: AMB-1083 ALS (96% Match Score)</p>
                              )}
                            </div>
                          )}

                          {simStep === "green-corridor" && (
                            <div className="space-y-1 text-green-400">
                              <p>&gt; VEHICLE ASSIGNED: AMB-1083 (Driver: Vivaan)</p>
                              <p>&gt; TARGET TRAUMA NODE: City Care Trauma Hub</p>
                              <p className="text-yellow-400 font-bold">&gt; OVERRIDING SIGNALS: Signals {activeSignals.join(", ")} GREEN</p>
                              <p className="text-[#00E5FF]">&gt; TRANSIT SECURE corridor ACTIVE · ETA {countdown}s</p>
                            </div>
                          )}

                          {simStep === "success" && (
                            <div className="space-y-1 text-green-400 font-bold animate-pulse">
                              <p>&gt; DISPATCH HANDOVER: COMPLETE</p>
                              <p>&gt; PATIENT SECURED AT CITY CARE TRAUMA HUB</p>
                              <p className="text-white">&gt; MISSION DURATION: 12.4s (Simulated)</p>
                              <p className="text-white">&gt; RESULT: LIFE SAVED</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#242E42] space-y-2">
                      {simStep === "success" ? (
                        <button
                          onClick={triggerSimulation}
                          className="w-full rounded-xl bg-[#E63946] hover:bg-[#C32F3A] py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" /> Re-launch Simulation
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (simStep === "idle") triggerSimulation();
                          }}
                          disabled={simStep !== "idle"}
                          className="w-full rounded-xl bg-[#E63946] hover:bg-[#C32F3A] py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Siren className="h-3.5 w-3.5" />
                          <span>Trigger SOS Simulation Beacon</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* HOLOGRAPHIC GLOW SUCCESS OVERLAY PANEL */}
                <AnimatePresence>
                  {simStep === "success" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#080C14]/90 z-50 flex items-center justify-center p-4 backdrop-blur-md rounded-3xl"
                    >
                      {/* Premium Ripple Waves */}
                      <div className="absolute h-96 w-96 rounded-full bg-[#E63946]/5 pulse-ring" />
                      <div className="absolute h-[600px] w-[600px] rounded-full bg-green-500/[0.02] pulse-ring delay-700" />
                      
                      <motion.div
                        initial={{ scale: 0.9, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 15 }}
                        className="max-w-md w-full text-center space-y-5 bg-[#131926]/90 border border-green-500/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.1)] relative"
                      >
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                          <Check className="h-8 w-8 animate-bounce" />
                        </div>
                        
                        <div className="space-y-1">
                          <h2 className="text-xl font-black uppercase tracking-widest text-white">Simulation Completed</h2>
                          <p className="text-[10px] uppercase font-bold text-green-400 tracking-widest animate-pulse">
                            AEGIS Dispatch Node Secure
                          </p>
                        </div>
                        
                        <div className="border border-[#242E42] bg-[#0A0D18]/60 p-4 rounded-2xl space-y-2">
                          <p className="text-[10px] text-[#8F9BB3] uppercase">Emergency Event Diagnostic</p>
                          <div className="flex justify-between items-center text-xs font-bold px-2">
                            <span className="text-white">Active Unit Dispatch</span>
                            <span className="text-[#00E5FF]">AMB-1083 ALS</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold px-2">
                            <span className="text-white">Transit Efficiency Gain</span>
                            <span className="text-green-400">↓ 42% (6m 12s Saved)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold px-2">
                            <span className="text-white">Corridor Lock Status</span>
                            <span className="text-green-400">Green Corridor Sync</span>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setSimMode(false);
                              setSimStep("idle");
                            }}
                            className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 text-xs font-bold text-white transition-all active:scale-95"
                          >
                            Exit Simulator
                          </button>
                          <button
                            onClick={triggerSimulation}
                            className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Restart
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : (
              /* STANDARD OPERATIONS MODE WITH GLOWING MOTION DESIGN */
              <motion.div
                key="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {/* 4 Counter Stat Cards with Loader Counter Animation */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <motion.div variants={cardVariants} className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm hover:border-[#E63946]/40 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">Active Emergencies</p>
                      <p className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
                        <Siren className="h-5.5 w-5.5 text-[#E63946] animate-pulse" />
                        <AnimatedCounter value={activeCount} />
                      </p>
                      <p className="text-[9px] text-[#E63946] font-bold mt-1 uppercase tracking-widest">+4 past hour</p>
                    </div>
                  </motion.div>

                  <motion.div variants={cardVariants} className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm hover:border-green-500/40 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">Avg Response Time</p>
                      <p className="text-2xl font-black text-green-400 mt-1.5 tracking-tight flex items-center gap-2">
                        <Timer className="h-5.5 w-5.5 text-green-400" />
                        <AnimatedCounter value={6} suffix="m 52s" />
                      </p>
                      <p className="text-[9px] text-green-400 font-bold mt-1 uppercase tracking-widest">↓ 34% baseline</p>
                    </div>
                  </motion.div>

                  <motion.div variants={cardVariants} className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm hover:border-[#00E5FF]/40 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">Active Fleet</p>
                      <p className="text-2xl font-black text-[#00E5FF] mt-1.5 tracking-tight flex items-center gap-2">
                        <Ambulance className="h-5.5 w-5.5 text-[#00E5FF]" />
                        <AnimatedCounter value={2} suffix=" / 5" />
                      </p>
                      <p className="text-[9px] text-[#00E5FF] font-bold mt-1 uppercase tracking-widest">ALS/BLS Units</p>
                    </div>
                  </motion.div>

                  <motion.div variants={cardVariants} className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm hover:border-[#FF9F0A]/40 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">Metropolitan ER Capacity</p>
                      <p className="text-2xl font-black text-[#FF9F0A] mt-1.5 tracking-tight flex items-center gap-2">
                        <Building2 className="h-5.5 w-5.5 text-[#FF9F0A]" />
                        <AnimatedCounter value={35} suffix=" beds" />
                      </p>
                      <p className="text-[9px] text-[#FF9F0A] font-bold mt-1 uppercase tracking-widest">Noida segment</p>
                    </div>
                  </motion.div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  {/* Neon Styled Map */}
                  <motion.div variants={cardVariants}>
                    <div className="rounded-3xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-[#242E42] pb-3">
                        <div>
                          <h3 className="text-xs font-bold text-white tracking-wide uppercase">City-Wide Emergency Map</h3>
                          <p className="text-[10px] text-[#8F9BB3] mt-0.5">Metropolitan GPS transit tracking network</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Live Coordinates Connection
                        </span>
                      </div>
                      <LiveMap className="h-[400px] rounded-2xl overflow-hidden border border-[#242E42]" markers={incidents.map((inc, i) => ({ id: inc.id, type: "emergency", x: 20 + i * 15, y: 70 - i * 10, active: true, label: inc.id }))} />
                    </div>
                  </motion.div>

                  {/* Incident feed listing */}
                  <motion.div variants={cardVariants}>
                    <div className="rounded-3xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm h-full flex flex-col">
                      <div className="mb-4 border-b border-[#242E42] pb-3">
                        <h3 className="text-xs font-bold text-white tracking-wide uppercase">Live Dispatch Feeds</h3>
                        <p className="text-[10px] text-[#8F9BB3] mt-0.5">Active incoming telemetry signals</p>
                      </div>
                      
                      <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1 flex-1">
                        {incidents.map((e, index) => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-xl border border-[#242E42] bg-[#161D2D]/60 p-4 flex justify-between items-center hover:border-gray-600 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold font-mono text-white">{e.id}</span>
                                <SeverityBadge severity={e.severity} />
                              </div>
                              <p className="text-xs font-extrabold text-[#ECEEF2]">{e.type}</p>
                              <p className="text-[9px] text-[#8F9BB3] font-semibold">{e.location} · {e.status}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Grid Timeline Details */}
      {tab === "emergencies" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#131926]/60 border border-[#242E42] p-6 shadow-sm"
        >
          <div className="mb-4 border-b border-[#242E42] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Active Incident Registry</h3>
            <p className="text-[10px] text-[#8F9BB3] mt-0.5">Audit log of ongoing rescue nodes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242E42] text-left text-[10px] font-extrabold uppercase tracking-wider text-[#8F9BB3]">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((e) => (
                  <tr key={e.id} className="border-b border-[#242E42]/60 hover:bg-[#161D2D]/35 transition-colors">
                    <td className="py-3 font-mono font-bold text-white text-xs">{e.id}</td>
                    <td className="py-3 text-xs text-[#ECEEF2] font-semibold">{e.type}</td>
                    <td className="py-3 text-xs"><SeverityBadge severity={e.severity} /></td>
                    <td className="py-3 text-xs text-[#8F9BB3] font-semibold">{e.location}</td>
                    <td className="py-3 font-mono text-[10px] text-[#00E5FF] font-bold">{e.assignedUnit ?? "—"}</td>
                    <td className="py-3 capitalize text-xs text-green-400 font-bold">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Fleet telemetry lists */}
      {tab === "ambulances" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl bg-[#131926]/60 border border-[#242E42] p-6 shadow-sm"
        >
          <div className="mb-4 border-b border-[#242E42] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Ambulance Fleet Status</h3>
            <p className="text-[10px] text-[#8F9BB3] mt-0.5">ALS & BLS responder telemetry tracker</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ambulances.map((a) => (
              <div key={a.id} className="rounded-2xl border border-[#242E42] bg-[#161D2D]/60 p-4 space-y-4 hover:border-gray-600 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                      a.status === "available" ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-[#E63946]/20 bg-[#E63946]/5 text-[#E63946]"
                    }`}>
                      <Ambulance className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{a.callsign}</h4>
                      <p className="text-[9px] text-[#8F9BB3] font-semibold mt-0.5">{a.driver}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold ${
                    a.status === "available" ? "bg-green-500/10 text-green-400" : "bg-[#E63946]/10 text-[#E63946]"
                  }`}>
                    {a.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">Current Velocity</span>
                  <span className="font-mono text-white">{a.speed > 0 ? `${a.speed} km/h` : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Critical ER capacities */}
      {tab === "hospitals" && (
        <div className="grid gap-4 md:grid-cols-3">
          {hospitals.map((h) => (
            <motion.div
              key={h.name}
              whileHover={{ y: -3 }}
              className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-extrabold text-white">{h.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-green-400">ER BEDS: {h.er}</div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 text-yellow-400">ICU BEDS: {h.icu}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Volunteer registries */}
      {tab === "volunteers" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl bg-[#131926]/60 border border-[#242E42] p-6 shadow-sm"
        >
          <div className="mb-4 border-b border-[#242E42] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Volunteer Network Matrix</h3>
            <p className="text-[10px] text-[#8F9BB3] mt-0.5">CPR certified civilian responders active</p>
          </div>
          <div className="space-y-2">
            {volunteers.map((v) => (
              <div key={v.name} className="flex items-center justify-between rounded-xl border border-[#242E42] bg-[#161D2D]/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E63946]/10 border border-[#E63946]/20 text-xs font-extrabold text-[#E63946]">
                    {v.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">{v.name}</p>
                    <p className="text-[9px] text-[#8F9BB3] font-semibold">{v.skill}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold ${
                  v.status === "responding" ? "bg-[#E63946]/10 text-[#E63946]" : "bg-green-500/10 text-green-400"
                }`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Live AI insights */}
      {tab === "ai" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="AI Recommendations" description="Live dispatch matching optimization" className="bg-[#131926]/60 border border-[#242E42] text-white">
            <div className="rounded-xl border border-[#E63946]/20 bg-[#E63946]/5 p-4 mb-4">
              <p className="text-xs font-extrabold text-[#E63946] uppercase tracking-wider">Active trigger · EMG-1258</p>
              <p className="mt-1 text-xs text-[#ECEEF2] font-semibold">Match Recommendation: AMB-1083 (Score 96%) · ETA 4m 12s</p>
            </div>
            <div className="space-y-2">
              {[
                { unit: "AMB-1083 ALS", score: 96, picked: true },
                { unit: "AMB-1102 BLS", score: 82, picked: false },
                { unit: "AMB-1057 ALS", score: 74, picked: false },
              ].map((r) => (
                <div key={r.unit} className={`rounded-xl p-3 border ${
                  r.picked ? "bg-green-500/5 border-green-500/30 text-green-400" : "bg-[#161D2D]/60 border-[#242E42] text-gray-400"
                }`}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{r.unit}</span>
                    <span>{r.score}% Compatibility</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          
          <SectionCard title="City Predictive Risk Assessment" description="Intelligent grid mitigations" className="bg-[#131926]/60 border border-[#242E42] text-white">
            <div className="space-y-3 text-xs leading-relaxed">
              {[
                { txt: "NH-24 corridor: 92% accident hazard probability next 6h. Recommended pre-positioning: 2 ALS responders.", badge: "Accident Risk" },
                { txt: "Sector 62: Cardiac incident spike projected 18:00–21:00. Pre-alerting volunteer defibrillator net.", badge: "Medical Spike" },
                { txt: "City Care ICU load reaches critical 85% utilization threshold. Routing emergency overflow to Yashoda.", badge: "Hospital Diversion" },
              ].map((insight, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl border border-[#242E42] bg-[#161D2D]/60 p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#00E5FF]" />
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#00E5FF]">{insight.badge}</span>
                  </div>
                  <p className="text-[11px] text-[#ECEEF2] font-semibold">{insight.txt}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Analytics view with styled charts */}
      {tab === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <SectionCard title="Response Time Analytics" description="Comparison with historical baseline" className="bg-[#131926]/60 border border-[#242E42] text-white">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={responseTimeData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#131926", border: "1px solid #242E42", borderRadius: 8, color: "#FFF", fontSize: 11 }} />
                  <Area type="monotone" dataKey="before" name="Before AEGIS" stroke="#E63946" fill="#E63946" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="after" name="After AEGIS" stroke="#00E676" fill="#00E676" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <SectionCard title="Daily Prevented Fatalities" description="Impact diagnostics score" className="bg-[#131926]/60 border border-[#242E42] text-white">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={livesSavedData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#131926", border: "1px solid #242E42", borderRadius: 8, color: "#FFF", fontSize: 11 }} />
                  <Bar dataKey="lives" fill="#00E676" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </motion.div>
        </div>
      )}

      {/* Heatmaps */}
      {tab === "heatmaps" && (
        <SectionCard title="Metropolitan Risk Forecast" description="Pre-emptive hazard modeling" className="bg-[#131926]/60 border border-[#242E42] text-white">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heatmapZones.map((z) => (
              <div key={z.name} className="rounded-xl border border-[#242E42] bg-[#161D2D]/60 p-4">
                <div className="flex justify-between text-xs font-bold text-white">
                  <span>{z.name}</span>
                  <span className="text-[#E63946]">{z.risk}% Risk Factor</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#1C2438]">
                  <div className="h-full bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.5)]" style={{ width: `${z.risk}%` }} />
                </div>
                <p className="mt-1.5 text-[9px] text-[#8F9BB3] font-semibold">{z.incidents} incidents logged past month</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* System health monitors */}
      {tab === "health" && (
        <SectionCard title="Operations Center Gateway Telemetry" description="Active pairing validation states" className="bg-[#131926]/60 border border-[#242E42] text-white">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "GPS Dispatch Latency", value: "12 ms", stat: "Optimal" },
              { label: "API Gateway Node", value: "99.98%", stat: "Locked" },
              { label: "Traffic Signal Overrides", value: "384 active", stat: "Synced" },
              { label: "Telemetry Database Uptime", value: "99.998%", stat: "Optimal" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-[#242E42] bg-[#161D2D]/60 p-5 text-center">
                <Server className="mx-auto h-5.5 w-5.5 text-[#8F9BB3] animate-pulse" />
                <p className="mt-2.5 text-[9px] font-extrabold uppercase tracking-widest text-[#8F9BB3]">{m.label}</p>
                <p className="text-lg font-black text-white mt-1">{m.value}</p>
                <p className="text-[9px] font-extrabold text-green-400 uppercase mt-1">● {m.stat}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Profile view */}
      {tab === "profile" && (() => {
        const profile = getProfile("admin");
        const name = profile.officerName || user?.name || "Grid Admin";
        const subtitle = `Clearance: ${profile.clearanceLevel || "Level 3"} · ID: ${profile.employeeId || "N/A"}`;

        return (
          <div className="space-y-4">
            <ProfileHeader name={name} subtitle={subtitle} role="admin" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-[#8F9BB3] tracking-widest">System Permissions</p>
                <p className="mt-2.5 font-bold text-white text-xs">{profile.clearanceLevel || "Emergency overrides · Audit access · Configuration"}</p>
              </div>
              <div className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-[#8F9BB3] tracking-widest">Region / Zone</p>
                <p className="mt-2.5 font-bold text-white text-xs">{profile.regionZone || "Delhi NCR Metropolitan Area"}</p>
              </div>
              <div className="rounded-2xl bg-[#131926]/60 border border-[#242E42] p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-[#8F9BB3] tracking-widest">Department / Designation</p>
                <p className="mt-2.5 font-bold text-white text-xs">{profile.departmentName || "Health Department"} · {profile.designation || "Grid Officer"}</p>
              </div>
            </div>
          </div>
        );
      })()}

    </AdminShell>
  );
}

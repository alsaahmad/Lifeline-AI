import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  Brain,
  Building2,
  ChevronRight,
  Clock,
  Droplets,
  Heart,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  Pill,
  Share2,
  Shield,
  Siren,
  Users,
  Send,
  Check,
  Play,
  ChevronLeft,
  Navigation,
  Activity,
  MessageSquare,
} from "lucide-react";
import { SectionCard } from "@/components/design-system";
import { CitizenShell, type CitizenTab } from "@/components/roles/citizen-shell";
import { LiveMap } from "@/components/live-map";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/citizen")({
  head: () => ({ meta: [{ title: "Citizen Portal · AEGIS" }] }),
  component: CitizenPortal,
});

import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

function CitizenPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "citizen")) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const [tab, setTab] = useState<CitizenTab>("home");
  const [sos, setSos] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeSegment, setActiveSegment] = useState<"Accident" | "Medical" | "Fire" | null>(null);

  if (isLoading || !isAuthenticated || user?.role !== "citizen") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-ping bg-[#E63946] rounded-full" />
      </div>
    );
  }

  useEffect(() => {
    if (!listening) return;
    const phrases = [
      "I am reporting an emergency",
      "I am reporting a road accident near Sector 62 Crossing,",
      "I am reporting a road accident near Sector 62 Crossing, two cars crashed.",
      "I am reporting a road accident near Sector 62 Crossing, two cars crashed, driver has head injury.",
    ];
    let i = 0;
    const id = setInterval(() => {
      setTranscript(phrases[i]);
      i++;
      if (i >= phrases.length) {
        clearInterval(id);
        setListening(false);
        setSos(true);
        setActiveSegment("Accident");
        setTab("tracking");
      }
    }, 1200);
    return () => clearInterval(id);
  }, [listening]);

  return (
    <CitizenShell
      activeTab={tab}
      onTabChange={setTab}
      header={
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
          Verified
        </span>
      }
    >
      {tab === "home" && <HomeView onSos={() => setTab("emergency")} onTrack={() => setTab("tracking")} sos={sos} />}
      {tab === "emergency" && (
        <EmergencyView
          sos={sos}
          setSos={setSos}
          listening={listening}
          setListening={setListening}
          transcript={transcript}
          setTranscript={setTranscript}
          activeSegment={activeSegment}
          setActiveSegment={setActiveSegment}
          onTrack={() => setTab("tracking")}
        />
      )}
      {tab === "tracking" && <TrackingView sos={sos} />}
      {tab === "history" && <HistoryView />}
      {tab === "profile" && <ProfileView />}
    </CitizenShell>
  );
}

import { getProfile } from "@/lib/profile";

const FIRST_AID_GUIDES: Record<string, { title: string; icon: any; steps: Array<{ title: string; desc: string }> }> = {
  cpr: {
    title: "CPR (Cardiopulmonary Resuscitation)",
    icon: Activity,
    steps: [
      { title: "Check Safety & Status", desc: "Ensure the scene is safe. Shake the victim gently and shout 'Are you okay?' to check for responsiveness." },
      { title: "Call for Rescue", desc: "Shout for nearby help. Activate the AEGIS SOS beacon immediately to alert nearby dispatch units." },
      { title: "Position Your Hands", desc: "Place the heel of one hand in the center of the chest. Interlock your other hand on top. Keep your elbows locked." },
      { title: "Push Hard & Fast", desc: "Compress the chest at least 2 inches at a rate of 100-120 compressions per minute (to the beat of 'Staying Alive')." }
    ]
  },
  choking: {
    title: "Choking Emergency",
    icon: AlertTriangle,
    steps: [
      { title: "Stand Behind the Victim", desc: "Lean the person slightly forward. Give 5 firm back blows between their shoulder blades using the heel of your hand." },
      { title: "Perform Abdominal Thrusts", desc: "Make a fist with one hand, place it just above the navel, grab it with your other hand, and pull sharply upward and inward." },
      { title: "Repeat Until Clear", desc: "Alternate between 5 back blows and 5 abdominal thrusts until the blockage is dislodged or the victim becomes unresponsive." }
    ]
  },
  bleeding: {
    title: "Severe Bleeding Control",
    icon: Droplets,
    steps: [
      { title: "Apply Direct Pressure", desc: "Cover the wound with a clean bandage or cloth. Apply firm, constant pressure with both hands directly on the bleed." },
      { title: "Elevate Above Heart", desc: "Keep pressure applied while elevating the injured limb above the level of the heart to slow down blood flow." },
      { title: "Maintain Pressure", desc: "Do not remove the cloth if it gets soaked; wrap clean bandages firmly over it and continue manual pressure." }
    ]
  },
  burns: {
    title: "Thermal Burns Care",
    icon: Heart,
    steps: [
      { title: "Cool Immediately", desc: "Run cool (not cold) running tap water over the burn site for 10-20 minutes. Never use ice or icy water." },
      { title: "Remove Constricting Items", desc: "Gently remove rings, bracelets, or tight clothing from the burned area before swelling starts." },
      { title: "Cover Loosely", desc: "Wrap the area loosely with sterile cling film or a clean plastic sheet to shield the raw skin and prevent infection." }
    ]
  }
};

const HOSPITALS_LIST = [
  {
    name: "Fortis Hospital, Noida",
    distance: "1.2 km",
    eta: "4 mins",
    icuBeds: 12,
    phone: "+91 120 240 0222",
    address: "Sector 62, Noida, UP"
  },
  {
    name: "Metro Hospital & Heart Institute",
    distance: "2.5 km",
    eta: "7 mins",
    icuBeds: 8,
    phone: "+91 120 422 6666",
    address: "Sector 11, Noida, UP"
  },
  {
    name: "Kailash Hospital & Heart Institute",
    distance: "4.1 km",
    eta: "11 mins",
    icuBeds: 15,
    phone: "+91 120 244 4444",
    address: "Sector 27, Noida, UP"
  },
  {
    name: "Max Super Speciality Hospital",
    distance: "5.8 km",
    eta: "15 mins",
    icuBeds: 19,
    phone: "+91 120 662 9999",
    address: "Sector 19, Noida, UP"
  }
];

function HomeView({ onSos, onTrack, sos }: { onSos: () => void; onTrack: () => void; sos: boolean }) {
  const { user } = useAuth();
  const profile = getProfile("citizen");
  const name = profile.name || user?.name || "Citizen";

  const [activeModal, setActiveModal] = useState<"first-aid" | "hospitals" | "chat" | "share" | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Hello! I am the AEGIS AI Emergency Dispatcher. I have accessed your location (Sector 62 Noida) and medical profile. What is the emergency?",
      time: "Now"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Share States
  const [sharingContacts, setSharingContacts] = useState<Record<string, boolean>>({});
  const [customPhone, setCustomPhone] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeModal === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isTyping, activeModal]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    
    // Add user message
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg, time: "Just now" }]);
    setChatInput("");
    setIsTyping(true);

    // AI Response Simulation
    setTimeout(() => {
      setIsTyping(false);
      let reply = "Responders are being dispatched. Please stay calm, keep the patient comfortable, and let me know if they are conscious and breathing.";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes("accident") || lower.includes("crash") || lower.includes("car")) {
        reply = "Understood. Road traffic dispatch protocol activated. I am notifying the Noida fleet. Please check if the victim is conscious and breathing, and secure them safely away from traffic.";
      } else if (lower.includes("heart") || lower.includes("pain") || lower.includes("chest") || lower.includes("cpr")) {
        reply = "This sounds like a potential cardiac event. I have dispatched a critical care transport. If the patient is unconscious and not breathing, begin chest compressions immediately (100-120 per min). I can guide you through CPR.";
      } else if (lower.includes("bleed") || lower.includes("blood") || lower.includes("cut")) {
        reply = "For severe bleeding: Apply firm, direct pressure on the wound using a clean cloth. Elevate the limb if possible. Do not lift the cloth to check; layer another clean cloth on top.";
      } else if (lower.includes("choke") || lower.includes("cough")) {
        reply = "Choking emergency flagged. If the victim can talk or cough, encourage them to cough hard. If they cannot speak or breathe, perform abdominal thrusts (Heimlich maneuver) immediately.";
      }
      
      setChatMessages((prev) => [...prev, { sender: "ai", text: reply, time: "Just now" }]);
    }, 1000);
  };

  const handleShareLocation = () => {
    setSharingLoading(true);
    setTimeout(() => {
      setSharingLoading(false);
      toast.success("Live GPS tracking link sent to selected recipients!");
      setActiveModal(null);
      setCustomPhone("");
    }, 1200);
  };

  const truncate = (str: string, len: number = 12) => {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "..." : str;
  };

  const bloodGroup = profile.bloodGroup || "O+";
  const allergies = profile.allergies || "None";
  const conditions = profile.conditions || "None";

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
        <p className="text-sm font-semibold text-[#111111]">Good afternoon, {name}</p>
        <p className="mt-1 text-xs text-[#525866]">Sector 62, Noida · GPS active</p>
        {sos && (
          <button
            type="button"
            onClick={onTrack}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#E63946]/10 px-4 py-3 text-left"
          >
            <div>
              <p className="text-xs font-bold text-[#E63946]">Active emergency in progress</p>
              <p className="text-[10px] text-[#525866]">AMB-1083 en route · ETA 4m</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#E63946]" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onSos}
        className="flex w-full items-center gap-4 rounded-2xl bg-[#E63946] p-5 text-left text-white shadow-lg active:scale-[0.98]"
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20">
          <Siren className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-bold">One-Tap SOS</p>
          <p className="text-xs text-white/80">Instant dispatch to nearest responders</p>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Brain, label: "AI First Aid", sub: "Step-by-step guide", action: () => setActiveModal("first-aid") },
          { icon: Building2, label: "Nearby Hospitals", sub: "4 within 6 km", action: () => setActiveModal("hospitals") },
          { icon: MessageCircle, label: "Emergency Chat", sub: "Talk to dispatcher", action: () => setActiveModal("chat") },
          { icon: Share2, label: "Share Location", sub: "Notify family", action: () => setActiveModal("share") },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="rounded-xl bg-white p-4 text-left ring-1 ring-[#E5E7EB] hover:bg-slate-50 transition-colors active:scale-[0.98]"
          >
            <item.icon className="h-5 w-5 text-[#E63946]" />
            <p className="mt-2 text-xs font-bold text-[#111111]">{item.label}</p>
            <p className="text-[10px] text-[#525866]">{item.sub}</p>
          </button>
        ))}
      </div>

      <SectionCard title="Medical Profile Summary" description="Shared with responders during SOS">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-[#F8F9FB] p-2" title={bloodGroup}>
            <Droplets className="mx-auto h-4 w-4 text-[#E63946]" />
            <p className="mt-1 font-bold">{truncate(bloodGroup, 12)}</p>
          </div>
          <div className="rounded-lg bg-[#F8F9FB] p-2" title={allergies}>
            <AlertTriangle className="mx-auto h-4 w-4 text-warning" />
            <p className="mt-1 font-bold">{truncate(allergies, 12)}</p>
          </div>
          <div className="rounded-lg bg-[#F8F9FB] p-2" title={conditions}>
            <Heart className="mx-auto h-4 w-4 text-medical" />
            <p className="mt-1 font-bold">{truncate(conditions, 12)}</p>
          </div>
        </div>
      </SectionCard>

      {/* AI First Aid Dialog */}
      <Dialog open={activeModal === "first-aid"} onOpenChange={(open) => { if(!open) { setActiveModal(null); setSelectedGuide(null); } }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E63946]">
              <Brain className="h-5 w-5 animate-pulse" />
              <span>AI First Aid Advisor</span>
            </DialogTitle>
          </DialogHeader>
          
          {!selectedGuide ? (
            <div className="space-y-3 py-3">
              <p className="text-xs text-[#525866] mb-2">Select an emergency category to get instant AI-guided rescue instructions:</p>
              {Object.entries(FIRST_AID_GUIDES).map(([key, guide]) => {
                const Icon = guide.icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedGuide(key); setCurrentStep(0); }}
                    className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white p-4 text-left transition-all hover:bg-slate-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-red-50 p-2 text-[#E63946]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{guide.title}</p>
                        <p className="text-[10px] text-[#525866]">{guide.steps.length} step guide</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#525866]" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 py-3">
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-[#525866]" />
                </button>
                <p className="text-xs font-bold text-[#111111]">{FIRST_AID_GUIDES[selectedGuide].title}</p>
              </div>
              
              <div className="rounded-2xl bg-[#E63946]/5 border border-[#E63946]/10 p-5 text-center min-h-[160px] flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-[#E63946]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E63946] uppercase">
                    Step {currentStep + 1} of {FIRST_AID_GUIDES[selectedGuide].steps.length}
                  </span>
                  <h3 className="mt-3 text-sm font-extrabold text-gray-900">
                    {FIRST_AID_GUIDES[selectedGuide].steps[currentStep].title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#525866]">
                    {FIRST_AID_GUIDES[selectedGuide].steps[currentStep].desc}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-center gap-1.5">
                  {FIRST_AID_GUIDES[selectedGuide].steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        currentStep === idx ? "w-6 bg-[#E63946]" : "w-1.5 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (currentStep > 0) {
                      setCurrentStep(currentStep - 1);
                    } else {
                      setSelectedGuide(null);
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-slate-50 transition-all"
                >
                  {currentStep > 0 ? "Previous" : "All Guides"}
                </button>
                
                <button
                  onClick={() => {
                    if (currentStep < FIRST_AID_GUIDES[selectedGuide].steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      toast.success("Emergency first-aid review complete. Stay alert!");
                      setSelectedGuide(null);
                      setActiveModal(null);
                    }
                  }}
                  className="flex-1 rounded-xl bg-[#E63946] py-2.5 text-xs font-bold text-white hover:bg-[#C32F3A] transition-all flex items-center justify-center gap-1"
                >
                  <span>{currentStep === FIRST_AID_GUIDES[selectedGuide].steps.length - 1 ? "Finish" : "Next"}</span>
                  {currentStep < FIRST_AID_GUIDES[selectedGuide].steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nearby Hospitals Dialog */}
      <Dialog open={activeModal === "hospitals"} onOpenChange={(open) => { if(!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E63946]">
              <Building2 className="h-5 w-5" />
              <span>Nearby Emergency Hospitals</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <p className="text-xs text-[#525866] mb-2">Trauma desks and emergency units near Sector 62 Noida:</p>
            
            {HOSPITALS_LIST.map((hosp) => (
              <div key={hosp.name} className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#111111]">{hosp.name}</h3>
                    <p className="text-[10px] text-[#525866] mt-0.5">{hosp.address} · {hosp.distance}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-success border border-green-100">
                    {hosp.icuBeds} ICU Beds
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <a
                    href={`tel:${hosp.phone.replace(/\s+/g, "")}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] bg-white py-1.5 text-[10px] font-bold text-gray-700 hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-3 w-3 text-[#E63946]" /> Call Trauma Desk
                  </a>
                  <button
                    onClick={() => {
                      toast.success(`Critical care dispatch request sent to ${hosp.name}!`);
                      onSos(); // Trigger SOS tracking
                      setActiveModal(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#E63946] py-1.5 text-[10px] font-bold text-white hover:bg-[#C32F3A] transition-colors"
                  >
                    <Navigation className="h-3 w-3" /> Route Ambulance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Chat Dialog */}
      <Dialog open={activeModal === "chat"} onOpenChange={(open) => { if(!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col h-[500px] bg-white">
          <div className="bg-[#E63946] text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <Brain className="h-4 w-4" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#E63946]" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">AEGIS Emergency Assistant</h3>
                <p className="text-[9px] text-white/85">AI Dispatcher · Noida Metro Node</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FB]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#E63946] text-white rounded-br-none"
                      : "bg-white text-[#111111] ring-1 ring-[#E5E7EB] rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`block text-[8px] mt-1 text-right ${msg.sender === "user" ? "text-white/60" : "text-[#525866]"}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white ring-1 ring-[#E5E7EB] rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#E63946] rounded-full delay-75" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#E63946] rounded-full delay-150" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#E63946] rounded-full delay-300" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-3 border-t border-[#E5E7EB] bg-white flex gap-2 items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }}
              placeholder="Describe symptoms, location or situation..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#E63946] focus:outline-none"
            />
            <button
              onClick={handleSendChat}
              className="h-8 w-8 grid place-items-center rounded-xl bg-[#E63946] text-white hover:bg-[#C32F3A] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Location Dialog */}
      <Dialog open={activeModal === "share"} onOpenChange={(open) => { if(!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E63946]">
              <Share2 className="h-5 w-5" />
              <span>Share Live Location Link</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Current Coordinate Beacon</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800">Sector 62, Noida, UP</span>
                <span className="rounded-md bg-[#E63946]/10 px-2 py-0.5 text-[10px] font-mono text-[#E63946] font-bold">
                  28.6273° N, 77.3725° E
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Configured emergency contacts</label>
              {profile.emergencyName ? (
                <label className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!sharingContacts["profile"]}
                      onChange={(e) => setSharingContacts({ ...sharingContacts, profile: e.target.checked })}
                      className="rounded text-[#E63946] focus:ring-[#E63946] h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#111111]">{profile.emergencyName}</p>
                      <p className="text-[10px] text-[#525866]">{profile.emergencyRelationship || "Contact"} · {profile.emergencyNumber}</p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="text-[11px] text-orange-600 bg-orange-50 border border-orange-100 rounded-xl p-3">
                  ⚠️ No primary emergency contact registered. Configure one in profile settings.
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Share with custom mobile number</label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 rounded-xl border border-gray-200 bg-slate-50 text-xs font-bold text-gray-500">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#E63946] focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleShareLocation}
              disabled={sharingLoading || (!profile.emergencyName && !customPhone)}
              className="w-full rounded-xl bg-[#E63946] py-2.5 text-xs font-bold text-white hover:bg-[#C32F3A] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {sharingLoading ? (
                <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Broadcast Security Link</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmergencyView({
  sos,
  setSos,
  listening,
  setListening,
  transcript,
  setTranscript,
  activeSegment,
  setActiveSegment,
  onTrack,
}: {
  sos: boolean;
  setSos: (v: boolean) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
  transcript: string;
  setTranscript: (v: string) => void;
  activeSegment: "Accident" | "Medical" | "Fire" | null;
  setActiveSegment: (v: "Accident" | "Medical" | "Fire" | null) => void;
  onTrack: () => void;
}) {
  const profile = getProfile("citizen");
  
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\s+/g, "");
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  let contacts: Array<{ name: string; relation: string; phone: string }> = [];

  if (profile.emergencyContacts) {
    const parts = profile.emergencyContacts.split(",");
    parts.forEach((part: string) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      const match = trimmedPart.match(/^(.*?)\s*\((.*?)\)\s*-\s*(.*)$/);
      if (match) {
        contacts.push({
          name: match[1].trim(),
          relation: match[2].trim(),
          phone: match[3].trim(),
        });
      } else {
        const phoneMatch = trimmedPart.match(/(\+?\d[\d\s-]{8,15}\d)/);
        const phone = phoneMatch ? phoneMatch[0].trim() : "";
        const name = phone ? trimmedPart.replace(phone, "").replace(/[-\s()]+$/, "").trim() : trimmedPart;
        contacts.push({
          name: name || "Emergency Contact",
          relation: "Family",
          phone: phone,
        });
      }
    });
  } else if (profile.emergencyName) {
    contacts.push({
      name: profile.emergencyName,
      relation: profile.emergencyRelationship || "Family",
      phone: profile.emergencyNumber || "",
    });
  }

  if (contacts.length === 0) {
    contacts = [
      { name: "Priya Sharma", relation: "Spouse", phone: "+91 98765 43210" },
      { name: "Ravi Sharma", relation: "Father", phone: "+91 98765 43211" },
    ];
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setSos(true)}
          className={`relative mx-auto grid h-40 w-40 place-items-center rounded-full bg-gradient-emergency text-white shadow-xl transition-transform active:scale-95 ${sos ? "pulse-emergency" : ""}`}
        >
          <div>
            <Siren className="mx-auto h-10 w-10" />
            <div className="mt-1 text-xl font-black tracking-widest">SOS</div>
          </div>
        </button>
        <p className="mt-4 text-xs text-[#525866]">
          {sos
            ? "Beacon active. Ambulance AMB-1083 dispatched with green corridor."
            : "Hold for 2 seconds or tap to broadcast emergency beacon."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {(["Accident", "Medical", "Fire"] as const).map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => {
                setActiveSegment(seg);
                setSos(true);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                activeSegment === seg ? "bg-[#E63946] text-white" : "bg-[#F8F9FB] text-[#525866] ring-1 ring-[#E5E7EB]"
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
        {sos && (
          <button type="button" onClick={onTrack} className="mt-4 text-xs font-bold text-[#E63946] underline">
            View live tracking →
          </button>
        )}
      </div>

      <SectionCard title="Voice SOS" description="Describe the emergency naturally">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setListening(!listening);
              if (!listening) {
                setTranscript("");
                setSos(false);
                setActiveSegment(null);
              }
            }}
            className={`grid h-14 w-14 place-items-center rounded-full ${listening ? "bg-[#E63946] text-white pulse-emergency" : "bg-[#F8F9FB] text-[#525866] ring-1 ring-[#E5E7EB]"}`}
          >
            {listening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-[#525866]">
              {listening ? "Listening..." : "Tap to speak"}
            </p>
            <p className="mt-1 text-xs italic text-[#111111]">{transcript || '"I need an ambulance..."'}</p>
          </div>
        </div>
        {sos && (
          <div className="mt-4 rounded-xl border border-medical/20 bg-medical/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-medical">
              <Brain className="h-4 w-4" /> AI Classification
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <Field k="Location" v="Sector 62 Crossing" />
              <Field k="Type" v="Road Traffic Collision" />
              <Field k="Victims" v="1 patient" />
              <Field k="Priority" v="High" />
            </dl>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Emergency Contacts" description="Auto-notified on SOS">
        {contacts.map((c, idx) => (
          <div key={`${c.name}-${c.phone}-${idx}`} className="flex items-center justify-between border-b border-[#E5E7EB] py-3 last:border-0">
            <div>
              <p className="text-sm font-semibold text-[#111111]">{c.name}</p>
              <p className="text-xs text-[#525866]">
                {c.relation} {c.phone && `· ${formatPhone(c.phone)}`}
              </p>
            </div>
            {c.phone && (
              <a href={`tel:${c.phone}`} className="grid h-9 w-9 place-items-center rounded-full bg-success/10 text-success">
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function TrackingView({ sos }: { sos: boolean }) {
  return (
    <div className="flex flex-col">
      <LiveMap
        className="min-h-[50vh] rounded-none border-0"
        showCorridor={sos}
        route={sos ? { from: [20, 75], via: [[40, 55]], to: [78, 22] } : undefined}
        markers={[
          { id: "me", type: "emergency", x: 20, y: 75, active: sos, label: "You" },
          { id: "amb", type: "ambulance", x: sos ? 38 : 60, y: sos ? 58 : 65, active: sos, label: "AMB-1083" },
          { id: "h1", type: "hospital", x: 78, y: 22, label: "City Care" },
        ]}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-[#E5E7EB]">
          <div>
            <p className="text-xs font-bold text-[#525866]">Ambulance ETA</p>
            <p className="text-2xl font-bold text-[#111111]">{sos ? "4m 12s" : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#525866]">Hospital</p>
            <p className="text-sm font-semibold text-[#111111]">City Care · 3.4 km</p>
          </div>
        </div>
        <ol className="space-y-2">
          {[
            { t: "SOS received", done: sos },
            { t: "Ambulance dispatched", done: sos },
            { t: "Green corridor active", done: sos },
            { t: "Hospital alerted", done: false },
            { t: "Patient handover", done: false },
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-xs">
              <span className={`h-2 w-2 rounded-full ${step.done ? "bg-success" : "bg-[#E5E7EB]"}`} />
              <span className={step.done ? "font-semibold text-[#111111]" : "text-[#525866]"}>{step.t}</span>
            </li>
          ))}
        </ol>
        <a
          href="tel:108"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F8F9FB] py-3 text-sm font-bold text-[#111111] ring-1 ring-[#E5E7EB]"
        >
          <PhoneCall className="h-4 w-4" /> Dial 108
        </a>
      </div>
    </div>
  );
}

function HistoryView() {
  const incidents = [
    { id: "EMG-1180", type: "Medical", date: "Mar 2, 2026", status: "Resolved", hospital: "City Care" },
    { id: "EMG-1092", type: "Accident", date: "Jan 15, 2026", status: "Resolved", hospital: "Apollo" },
  ];
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-semibold text-[#111111]">Emergency History</p>
      {incidents.map((inc) => (
        <div key={inc.id} className="rounded-xl bg-white p-4 ring-1 ring-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">{inc.id}</span>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">{inc.status}</span>
          </div>
          <p className="mt-1 text-sm text-[#525866]">{inc.type} · {inc.date}</p>
          <p className="mt-1 text-xs text-[#525866]">Admitted to {inc.hospital}</p>
        </div>
      ))}
    </div>
  );
}

import ProfileHeader from "@/components/profile/profile-header";

function ProfileView() {
  const { user } = useAuth();
  const profile = getProfile("citizen");
  const name = profile.name || user?.name || "Citizen";

  return (
    <div className="space-y-4 p-4">
      <ProfileHeader name={name} subtitle={`Citizen ID · ${user?.id || "N/A"}`} role="citizen" />
      {[
        { icon: Droplets, label: "Blood Group", value: profile.bloodGroup || "O Positive" },
        { icon: Pill, label: "Allergies", value: profile.allergies || "Penicillin, Sulfa drugs" },
        { icon: Heart, label: "Conditions", value: profile.conditions || "Hypertension (controlled)" },
        { icon: Users, label: "Emergency Contacts", value: profile.emergencyContacts || "2 configured" },
        { icon: Shield, label: "Insurance", value: profile.insurance || "Star Health · Active" },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-[#E5E7EB]">
          <row.icon className="h-5 w-5 text-[#525866]" />
          <div>
            <p className="text-[10px] font-bold uppercase text-[#525866]">{row.label}</p>
            <p className="text-sm font-semibold text-[#111111]">{row.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase text-[#525866]">{k}</dt>
      <dd className="font-semibold text-[#111111]">{v}</dd>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { saveProfile, getProfile } from "@/lib/profile";
import { toast } from "sonner";
import { MotionButton } from "@/components/ui/motion";

export default function ProfileEdit({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) return;
    const p = getProfile(role);
    setForm({
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      bloodGroup: p.bloodGroup || "",
      conditions: p.conditions || "",
      allergies: p.allergies || "",
      emergencyContacts: p.emergencyContacts || "",
      insurance: p.insurance || "",
      certificationType: p.certificationType || "",
      availabilitySchedule: p.availabilitySchedule || "",
      availabilityRadius: p.availabilityRadius || "",
      hospitalType: p.hospitalType || "",
      registrationNumber: p.registrationNumber || "",
      ambulanceNumber: p.ambulanceNumber || "",
      gpsDeviceId: p.gpsDeviceId || "",
      vehicleType: p.vehicleType || "",
      clearanceLevel: p.clearanceLevel || "",
      regionZone: p.regionZone || "",
      departmentName: p.departmentName || "",
      designation: p.designation || "",
    });
  }, [open, role]);

  const handleSave = () => {
    if (!form.name || form.name.trim().length < 2) return toast.error("Name is required");
    if (!form.phone || form.phone.trim().length < 6) return toast.error("Valid phone required");
    const ok = saveProfile(role, form);
    if (ok) {
      toast.success("Profile updated successfully");
      setOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast.error("Save failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <MotionButton className="rounded-lg px-3 py-2 text-sm font-semibold text-[#525866] ring-1 ring-[#E5E7EB]">Edit Profile</MotionButton>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#525866] uppercase">Full name / Entity name</label>
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#525866] uppercase">Phone</label>
              <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#525866] uppercase">Email</label>
              <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#525866] uppercase">Address</label>
              <input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
            </div>
          </div>

          {/* CITIZEN SPECIFIC FIELDS */}
          {role === "citizen" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-bold text-gray-900">Citizen Medical Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Blood group</label>
                  <input value={form.bloodGroup || ""} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Insurance Info</label>
                  <input value={form.insurance || ""} onChange={(e) => setForm({ ...form, insurance: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Medical conditions</label>
                  <input value={form.conditions || ""} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Allergies</label>
                  <input value={form.allergies || ""} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#525866] uppercase">Emergency Contacts</label>
                <input value={form.emergencyContacts || ""} onChange={(e) => setForm({ ...form, emergencyContacts: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none" />
              </div>
            </div>
          )}

          {/* VOLUNTEER SPECIFIC FIELDS */}
          {role === "volunteer" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-bold text-gray-900">Responder Qualifications</p>
              <div>
                <label className="text-[10px] font-bold text-[#525866] uppercase">Active Certifications</label>
                <input value={form.certificationType || ""} onChange={(e) => setForm({ ...form, certificationType: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-purple-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Duty Schedule</label>
                  <select value={form.availabilitySchedule || ""} onChange={(e) => setForm({ ...form, availabilitySchedule: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-purple-600 focus:outline-none">
                    <option value="">Select Schedule</option>
                    <option value="24/7 Available">24/7 Available</option>
                    <option value="Evenings & Weekends">Evenings &amp; Weekends</option>
                    <option value="On-Call Duty Only">On-Call Duty Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Response Radius</label>
                  <select value={form.availabilityRadius || ""} onChange={(e) => setForm({ ...form, availabilityRadius: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-purple-600 focus:outline-none">
                    <option value="">Select Radius</option>
                    <option value="500m">500 meters</option>
                    <option value="1km">1 kilometer</option>
                    <option value="2km">2 kilometers</option>
                    <option value="5km">5 kilometers</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AMBULANCE SPECIFIC FIELDS */}
          {role === "ambulance" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-bold text-gray-900">Vehicle & Telemetry Configuration</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Vehicle Plate No</label>
                  <input value={form.ambulanceNumber || ""} onChange={(e) => setForm({ ...form, ambulanceNumber: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-amber-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">GPS Hardware ID</label>
                  <input value={form.gpsDeviceId || ""} onChange={(e) => setForm({ ...form, gpsDeviceId: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-amber-600 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Support Class</label>
                  <select value={form.vehicleType || ""} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-amber-600 focus:outline-none">
                    <option value="">Select Level</option>
                    <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                    <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS)</option>
                    <option value="ICU Ambulance">ICU Ambulance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Active Shift</label>
                  <input value={form.availabilitySchedule || ""} onChange={(e) => setForm({ ...form, availabilitySchedule: e.target.value })} placeholder="06:00 – 18:00" className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-amber-600 focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* HOSPITAL SPECIFIC FIELDS */}
          {role === "hospital" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-bold text-gray-900">Hospital Licensing Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Trauma Center Rating</label>
                  <select value={form.hospitalType || ""} onChange={(e) => setForm({ ...form, hospitalType: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-blue-600 focus:outline-none">
                    <option value="">Select Category</option>
                    <option value="Government Trauma Hub">Government Trauma Hub</option>
                    <option value="Private Super-Specialty">Private Super-Specialty</option>
                    <option value="Specialty Trauma Center">Specialty Trauma Center</option>
                    <option value="General Hospital">General Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">License Certificate ID</label>
                  <input value={form.registrationNumber || ""} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SPECIFIC FIELDS */}
          {role === "admin" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-bold text-gray-900">Government Clearance</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Department</label>
                  <input value={form.departmentName || ""} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-slate-800 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Designation</label>
                  <input value={form.designation || ""} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Clearance level</label>
                  <select value={form.clearanceLevel || ""} onChange={(e) => setForm({ ...form, clearanceLevel: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-slate-800 focus:outline-none">
                    <option value="">Select Level</option>
                    <option value="Level 1 - General dispatch">Level 1 - General dispatch</option>
                    <option value="Level 2 - Fleet Allocations">Level 2 - Fleet Allocations</option>
                    <option value="Level 3 - Metropolitan Override">Level 3 - Metropolitan Override</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#525866] uppercase">Command region</label>
                  <select value={form.regionZone || ""} onChange={(e) => setForm({ ...form, regionZone: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-white focus:border-slate-800 focus:outline-none">
                    <option value="">Select Region</option>
                    <option value="Delhi NCR Metropolitan Region">Delhi NCR Metropolitan Region</option>
                    <option value="Mumbai Smart Grid Area">Mumbai Smart Grid Area</option>
                    <option value="Bengaluru Operations Grid">Bengaluru Operations Grid</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="flex w-full justify-between pt-2">
            <MotionButton onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#525866] ring-1 ring-[#E5E7EB]">Cancel</MotionButton>
            <div className="ml-2 flex gap-2">
              <MotionButton onClick={handleSave} className="rounded-lg bg-[#E63946] px-4 py-2 text-sm font-bold text-white">Save Changes</MotionButton>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

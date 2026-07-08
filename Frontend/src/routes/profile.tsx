import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Mail, Phone, MapPin, Globe, Eye, Shield, Calendar, Save, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/authApi";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const LANGUAGES = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi"];

function ProfilePage() {
  const { user, token, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    village: user?.village || "",
    district: user?.district || "",
    state: user?.state || "",
    preferred_language: user?.preferred_language || "English",
    visibility: user?.visibility || "village",
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        village: user.village || "",
        district: user.district || "",
        state: user.state || "",
        preferred_language: user.preferred_language || "English",
        visibility: user.visibility || "village",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await authApi.updateProfile(token, form);
      setUser(updated);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = async (vis: string) => {
    if (!token) return;
    setForm(prev => ({ ...prev, visibility: vis }));
    try {
      const updated = await authApi.updateVisibility(token, vis);
      setUser(updated);
    } catch (err) {
      console.error("Visibility update failed:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-emerald-400" />
          Farmer Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and privacy settings</p>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Profile updated successfully!
        </motion.div>
      )}

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden">

        {/* Header Banner */}
        <div className="h-24 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-sidebar">
              {user.full_name?.charAt(0)?.toUpperCase() || "F"}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          {/* Name & Metadata */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Joined {user.joined_date ? new Date(user.joined_date).toLocaleDateString() : "Recently"}
              </p>
              <p className="text-xs text-emerald-500/60 uppercase mt-1">Farmer ID: #{user.id}</p>
            </div>
            <button onClick={() => setEditing(!editing)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                editing
                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              }`}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: "Full Name", key: "full_name", icon: UserCircle },
              { label: "Phone", key: "phone", icon: Phone },
              { label: "Village", key: "village", icon: MapPin },
              { label: "District", key: "district", icon: MapPin },
              { label: "State", key: "state", icon: Globe },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {label}
                </label>
                {editing ? (
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full py-2.5 px-3 bg-background border border-sidebar-border rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                ) : (
                  <p className="text-sm text-foreground py-2.5">{(user as any)[key] || <span className="text-muted-foreground italic">Not set</span>}</p>
                )}
              </div>
            ))}

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <p className="text-sm text-foreground py-2.5">{user.email}</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Preferred Language
              </label>
              {editing ? (
                <select value={form.preferred_language}
                  onChange={(e) => setForm(prev => ({ ...prev, preferred_language: e.target.value }))}
                  className="w-full py-2.5 px-3 bg-background border border-sidebar-border rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all appearance-none">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <p className="text-sm text-foreground py-2.5">{user.preferred_language}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Role
              </label>
              <p className="text-sm text-foreground py-2.5 capitalize">{user.role}</p>
            </div>
          </div>

          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Visibility Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-sidebar border border-sidebar-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-emerald-400" />
          Visibility Settings
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Control who can see your farm information</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: "private", label: "Private", icon: "🔒", desc: "Only you can see your farm details" },
            { value: "village", label: "Village", icon: "🏘️", desc: "Visible to farmers in your village" },
            { value: "public", label: "Public", icon: "🌐", desc: "Anyone can see summarized info" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleVisibilityChange(opt.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                form.visibility === opt.value
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-sidebar-border hover:border-emerald-800/50"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <p className="text-sm font-semibold text-foreground mt-2">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

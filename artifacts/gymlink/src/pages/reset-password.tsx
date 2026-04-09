import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logoImg from "/logo.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const handleReset = async () => {
    if (!token) { toast({ title: "Invalid reset link", variant: "destructive" }); return; }
    if (newPw.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPw !== confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Reset failed");
      setDone(true);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Reset failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "hsl(var(--background))" }}>
      <img src={logoImg} alt="GymLink" className="w-40 mb-8 drop-shadow-xl" />

      {!token ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid or missing reset link.</p>
          <button onClick={() => navigate("/")} className="text-sm underline opacity-70">Go to sign in</button>
        </div>
      ) : done ? (
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Password updated!</h2>
          <p className="text-sm opacity-60 mb-6">You can now sign in with your new password.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl font-bold text-white"
            style={{ background: "hsl(var(--primary))" }}
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold mb-1">Set new password</h2>
          <p className="text-sm opacity-60 mb-6">Choose a strong password for your GymLink account.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-2">New Password</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest opacity-50 mb-2">Confirm Password</label>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="mt-6 w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useAuth, registerUser, loginUser, forgotPassword } from "@/context/auth";
import { useListGyms } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LogIn, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logoImg from "/logo.png";

const INTEREST_OPTIONS = [
  "Powerlifting", "Bodybuilding", "CrossFit", "Running", "Yoga", "HIIT",
  "Nutrition", "Cardio", "Flexibility", "Kettlebells", "Boxing", "Cycling",
  "Swimming", "Pilates", "Calisthenics", "Olympic Lifting", "Mobility",
  "Meal Prep", "Posing", "Jump Rope", "Functional Training", "Beginner Lifting",
];

type Screen = "landing" | "sign-in" | "forgot" | "join-name" | "join-gym" | "join-interests";

interface JoinData {
  name: string;
  username: string;
  email: string;
  age: string;
  bio: string;
  gymId: string;
  gymName: string;
  schedule: string;
  interests: string[];
  password: string;
  confirmPassword: string;
}

export default function Welcome() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("landing");
  const [joinData, setJoinData] = useState<JoinData>({
    name: "", username: "", email: "", age: "", bio: "", gymId: "", gymName: "", schedule: "",
    interests: [], password: "", confirmPassword: "",
  });
  const [gymSearch, setGymSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign-in state
  const [signInName, setSignInName] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPw, setShowSignInPw] = useState(false);

  // Show/hide password on join
  const [showJoinPw, setShowJoinPw] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const { data: gyms = [] } = useListGyms();

  const filteredGyms = gymSearch
    ? gyms.filter((g) => g.name.toLowerCase().includes(gymSearch.toLowerCase()))
    : gyms;

  const toggleInterest = (i: string) => {
    setJoinData((prev) => ({
      ...prev,
      interests: prev.interests.includes(i)
        ? prev.interests.filter((x) => x !== i)
        : [...prev.interests, i],
    }));
  };

  const handleSignIn = async () => {
    if (!signInName.trim() || !signInPassword) {
      toast({ title: "Please enter your name and password", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { userId } = await loginUser(signInName.trim(), signInPassword);
      login(userId);
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Sign in failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    setIsSubmitting(true);
    try {
      const { userId } = await registerUser({
        name: joinData.name.trim(),
        username: joinData.username.trim(),
        email: joinData.email.trim(),
        age: parseInt(joinData.age),
        bio: joinData.bio,
        gymId: joinData.gymId || undefined,
        gymName: joinData.gymName || undefined,
        schedule: joinData.schedule,
        interests: joinData.interests,
        password: joinData.password,
      });
      login(userId);
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (screen === "join-gym") setScreen("join-name");
    else if (screen === "join-interests") setScreen("join-gym");
    else if (screen === "forgot") setScreen("sign-in");
    else setScreen("landing");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {screen !== "landing" && (
        <button
          onClick={goBack}
          className="absolute top-5 left-5 flex items-center gap-2 text-sm font-semibold z-10"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* Landing */}
      {screen === "landing" && (
        <div style={{ position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
          {/* Fixed background — always covers the full viewport */}
          <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundColor: "#0A0D1A" }}>
            <img
              src="/hero-gym.jpeg"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%", display: "block" }}
            />
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(10,13,26,0.90) 0%, rgba(10,13,26,0.80) 18%, rgba(10,13,26,0.20) 38%, rgba(10,13,26,0.45) 60%, rgba(10,13,26,0.97) 82%, rgba(10,13,26,1) 100%)",
              }}
            />
          </div>

          {/* Content: logo fills top, cta anchored bottom */}
          <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
            {/* Logo — pinned to the top, clear of the face */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(12px, 3vh, 28px)", paddingLeft: 16, paddingRight: 16 }}>
              <img
                src={logoImg}
                alt="GymLink"
                className="drop-shadow-2xl"
                style={{ width: "min(70vw, 28vh)", height: "auto", maxWidth: "70vw" }}
              />
            </div>
            {/* Spacer to push CTA down */}
            <div style={{ flex: 1 }} />

            {/* CTA — lower section */}
            <div className="px-6 pb-8 text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white leading-tight">
                Find your<br />gym crew
              </h1>
              <p className="text-base mb-6 max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                Connect with gym crushes, workout buddies, advisors, and spotters at your gym.
              </p>
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => setScreen("join-name")}
                  className="w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <UserPlus className="w-4 h-4" />
                  Join GymLink
                </button>
                <button
                  onClick={() => setScreen("sign-in")}
                  className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign-in */}
      {screen === "sign-in" && (
        <div className="flex-1 flex flex-col px-6 pt-20 max-w-md mx-auto w-full">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            Enter your name and password to sign in
          </p>

          <div className="space-y-4">
            <div>
              <label className="section-label block mb-2">Name</label>
              <Input
                placeholder="Your name"
                value={signInName}
                onChange={(e) => setSignInName(e.target.value)}
                className="h-11 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>
            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showSignInPw ? "text" : "password"}
                  placeholder="Your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="h-11 text-sm pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                >
                  {showSignInPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isSubmitting}
            className="mt-8 w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "hsl(var(--primary))" }}
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          <button
            onClick={() => setScreen("forgot")}
            className="mt-3 text-sm text-center w-full opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Forgot password?
          </button>

          <button
            onClick={() => setScreen("join-name")}
            className="mt-2 text-sm font-semibold text-center w-full"
            style={{ color: "hsl(var(--primary))" }}
          >
            New here? Join GymLink
          </button>
        </div>
      )}

      {/* Forgot password */}
      {screen === "forgot" && (
        <div className="flex-1 flex flex-col px-6 pt-20 max-w-md mx-auto w-full">
          {forgotSent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2">Check your email</h2>
              <p className="text-sm opacity-60 mb-6">We sent a password reset link to <strong>{forgotEmail}</strong>. Check your inbox and click the link to set a new password.</p>
              <button
                onClick={() => { setForgotSent(false); setForgotEmail(""); setScreen("sign-in"); }}
                className="text-sm font-semibold"
                style={{ color: "hsl(var(--primary))" }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight">Forgot password?</h2>
                <p className="text-sm opacity-60 mt-1">Enter the email you signed up with and we'll send you a reset link.</p>
              </div>
              <div>
                <label className="section-label block mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-11 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={isSubmitting}
                className="mt-6 w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "hsl(var(--primary))" }}
              >
                {isSubmitting ? "Sending…" : "Send Reset Link"}
              </button>
              <button
                onClick={() => setScreen("sign-in")}
                className="mt-4 text-sm text-center w-full opacity-60 hover:opacity-100"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      )}

      {/* Join: Name + Age + Bio + Password */}
      {screen === "join-name" && (
        <div className="flex-1 flex flex-col px-6 pt-20 max-w-md mx-auto w-full">
          <div className="mb-8">
            <p className="section-label mb-1">Step 1 of 3</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Tell us about you</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="section-label block mb-2">Display Name</label>
              <Input
                placeholder="Alex Rivera"
                value={joinData.name}
                onChange={(e) => setJoinData((p) => ({ ...p, name: e.target.value }))}
                className="h-11 text-sm"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm">@</span>
                <Input
                  placeholder="alexrivera"
                  value={joinData.username}
                  onChange={(e) => setJoinData((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  className="h-11 text-sm pl-7"
                />
              </div>
              <p className="text-xs opacity-40 mt-1">Letters, numbers, and underscores only</p>
            </div>
            <div>
              <label className="section-label block mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={joinData.email}
                onChange={(e) => setJoinData((p) => ({ ...p, email: e.target.value }))}
                className="h-11 text-sm"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Age</label>
              <Input
                type="number"
                placeholder="25"
                value={joinData.age}
                onChange={(e) => setJoinData((p) => ({ ...p, age: e.target.value }))}
                className="h-11 text-sm w-32"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Bio (optional)</label>
              <textarea
                placeholder="Powerlifting fanatic, always at the squat rack..."
                value={joinData.bio}
                onChange={(e) => setJoinData((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border resize-none"
                style={{ background: "hsl(var(--input))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </div>
            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showJoinPw ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={joinData.password}
                  onChange={(e) => setJoinData((p) => ({ ...p, password: e.target.value }))}
                  className="h-11 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowJoinPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                >
                  {showJoinPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="section-label block mb-2">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showJoinConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  value={joinData.confirmPassword}
                  onChange={(e) => setJoinData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="h-11 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowJoinConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
                >
                  {showJoinConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="section-label block mb-2">Schedule (optional)</label>
              <Input
                placeholder="Mon-Fri 6PM"
                value={joinData.schedule}
                onChange={(e) => setJoinData((p) => ({ ...p, schedule: e.target.value }))}
                className="h-11 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (!joinData.name.trim()) {
                toast({ title: "Display name is required", variant: "destructive" });
                return;
              }
              if (!joinData.username.trim() || joinData.username.length < 2) {
                toast({ title: "Username must be at least 2 characters", variant: "destructive" });
                return;
              }
              if (!joinData.email.trim() || !joinData.email.includes("@")) {
                toast({ title: "A valid email is required", variant: "destructive" });
                return;
              }
              if (!joinData.age) {
                toast({ title: "Age is required", variant: "destructive" });
                return;
              }
              if (joinData.password.length < 6) {
                toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                return;
              }
              if (joinData.password !== joinData.confirmPassword) {
                toast({ title: "Passwords don't match", variant: "destructive" });
                return;
              }
              setScreen("join-gym");
            }}
            className="mt-8 w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--primary))" }}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Join: Gym selection */}
      {screen === "join-gym" && (
        <div className="flex-1 flex flex-col px-6 pt-20 max-w-md mx-auto w-full">
          <div className="mb-6">
            <p className="section-label mb-1">Step 2 of 3</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Your gym</h2>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Choose where you train</p>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            <Input
              placeholder="Search gyms..."
              value={gymSearch}
              onChange={(e) => setGymSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {filteredGyms.map((gym) => {
              const selected = joinData.gymId === gym.id;
              return (
                <button
                  key={gym.id}
                  onClick={() => setJoinData((p) => ({ ...p, gymId: gym.id, gymName: gym.name }))}
                  className="w-full card-surface px-4 py-3.5 flex items-center gap-3 text-left transition-all"
                  style={selected ? { borderColor: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)" } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{gym.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {gym.address} · {gym.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  {selected && <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />}
                </button>
              );
            })}
          </div>
          <div className="pt-3 space-y-2">
            <button
              onClick={() => setScreen("join-interests")}
              disabled={!joinData.gymId}
              className="w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "hsl(var(--primary))" }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScreen("join-interests")}
              className="w-full py-2 text-sm font-semibold text-center"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Join: Interests */}
      {screen === "join-interests" && (
        <div className="flex-1 flex flex-col px-6 pt-20 max-w-md mx-auto w-full">
          <div className="mb-6">
            <p className="section-label mb-1">Step 3 of 3</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Your interests</h2>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Pick what you're into</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-2 pb-4">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = joinData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={selected
                      ? { background: "hsl(var(--primary))", color: "#fff" }
                      : { background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }
                    }
                  >
                    {selected && <span className="mr-1">✓</span>}{interest}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pt-3 space-y-2">
            <button
              onClick={handleJoin}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "hsl(var(--primary))" }}
            >
              {isSubmitting ? "Creating account…" : (
                <><Check className="w-4 h-4" /> Create my profile</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

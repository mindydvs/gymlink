import { useState } from "react";
import { useAuth, registerUser, loginUser } from "@/context/auth";
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

type Screen = "landing" | "sign-in" | "join-name" | "join-gym" | "join-interests";

interface JoinData {
  name: string;
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
    name: "", age: "", bio: "", gymId: "", gymName: "", schedule: "",
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

  const goBack = () => {
    if (screen === "join-gym") setScreen("join-name");
    else if (screen === "join-interests") setScreen("join-gym");
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
        <div className="flex-1 relative flex flex-col" style={{ minHeight: "100dvh" }}>
          <div className="absolute inset-0">
            <img
              src="/hero-lunge.jpeg"
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(10,13,26,0.45) 0%, rgba(10,13,26,0.65) 45%, rgba(10,13,26,0.95) 78%, rgba(10,13,26,1) 100%)",
              }}
            />
          </div>

          <div className="relative flex flex-col items-center justify-end flex-1 px-6 pb-8 text-center">
            <img src={logoImg} alt="GymLink" className="mb-4 drop-shadow-lg" style={{ width: "clamp(260px, 35vw, 560px)", height: "auto", maxHeight: "55vh" }} />
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-white leading-tight">
              Find your<br />gym crew
            </h1>
            <p className="text-base mb-10 max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
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
            onClick={() => setScreen("join-name")}
            className="mt-4 text-sm font-semibold text-center w-full"
            style={{ color: "hsl(var(--primary))" }}
          >
            New here? Join GymLink
          </button>
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
              <label className="section-label block mb-2">Full Name</label>
              <Input
                placeholder="Alex Rivera"
                value={joinData.name}
                onChange={(e) => setJoinData((p) => ({ ...p, name: e.target.value }))}
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
              if (!joinData.name.trim() || !joinData.age) {
                toast({ title: "Name and age are required", variant: "destructive" });
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

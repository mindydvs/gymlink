import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetUser, useCreateConnection, getGetUserQueryKey, getListConnectionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Dumbbell, Brain, HandHelpingIcon, MapPin, Clock, CheckCircle, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CONNECTION_TYPES = [
  { type: "crush" as const, label: "Gym Crush", icon: Heart, color: "#FF3366", desc: "You find them attractive" },
  { type: "buddy" as const, label: "Workout Buddy", icon: Dumbbell, color: "#3B82F6", desc: "Train together" },
  { type: "advisor" as const, label: "Fitness Advisor", icon: Brain, color: "#10B981", desc: "Get tips & advice" },
  { type: "spotter" as const, label: "Spotter", icon: HandHelpingIcon, color: "#F59E0B", desc: "Need a spot?" },
];

export default function MemberDetail() {
  const [, params] = useRoute("/members/:id");
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetUser(
    params?.id ?? "",
    { query: { enabled: !!params?.id, queryKey: getGetUserQueryKey(params?.id ?? "") } }
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [sent, setSent] = useState(false);
  const createConnection = useCreateConnection();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleConnect = () => {
    if (!selectedType || !user) return;
    createConnection.mutate(
      {
        data: {
          toUserId: user.id,
          type: selectedType as "crush" | "buddy" | "advisor" | "spotter",
          anonymous: selectedType === "crush" ? anonymous : false,
        },
      },
      {
        onSuccess: () => {
          setSent(true);
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
          toast({ title: "Connection sent!", description: `You connected with ${user.name}` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to send connection", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-semibold">Member not found</p>
        <Button variant="ghost" onClick={() => setLocation("/members")} className="mt-4">Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => setLocation("/members")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold"
        data-testid="btn-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-card border border-border/50 rounded-3xl p-8 text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-muted to-muted/30 flex items-center justify-center text-5xl mx-auto mb-4">
          {user.avatar}
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-black">{user.name}</h1>
          {user.verified && <span className="text-[#3B82F6] font-bold">✓</span>}
          {user.activeNow && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          )}
        </div>
        <p className="text-muted-foreground mt-1">{user.age} years old</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{user.distance} away</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{user.schedule}</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">About</h2>
        <p className="text-foreground leading-relaxed">{user.bio}</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Interests</h2>
        <div className="flex flex-wrap gap-2">
          {user.interests.map((interest) => (
            <Badge key={interest} variant="outline" className="bg-muted/50 border-border text-foreground">
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {!sent ? (
        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Connect with {user.name.split(" ")[0]}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CONNECTION_TYPES.map(({ type, label, icon: Icon, color, desc }) => {
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${isSelected ? "border-current" : "border-border/50 hover:border-white/20"}`}
                  style={isSelected ? { borderColor: color, background: color + "11" } : undefined}
                  data-testid={`btn-connection-type-${type}`}
                >
                  <Icon className="w-5 h-5 mb-2" style={{ color }} />
                  <p className="font-semibold text-sm" style={{ color: isSelected ? color : undefined }}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>

          {selectedType === "crush" && (
            <button
              onClick={() => setAnonymous(!anonymous)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${anonymous ? "border-[#FF3366]/50 bg-[#FF3366]/10" : "border-border/50"}`}
              data-testid="btn-anonymous-toggle"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${anonymous ? "bg-[#FF3366]" : "border border-border"}`}>
                {anonymous && <EyeOff className="w-3 h-3 text-white" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{anonymous ? "Anonymous" : "Show your name"}</p>
                <p className="text-xs text-muted-foreground">{anonymous ? "They won't see it's you" : "They'll know who you are"}</p>
              </div>
            </button>
          )}

          <Button
            onClick={handleConnect}
            disabled={!selectedType || createConnection.isPending}
            className="w-full font-bold rounded-xl h-12"
            style={selectedType ? {
              background: CONNECTION_TYPES.find(c => c.type === selectedType)?.color,
              color: "white",
            } : undefined}
            data-testid="btn-send-connection"
          >
            {createConnection.isPending ? "Sending..." : "Send Connection"}
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-[#10B981]/30 rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
          <p className="font-bold text-lg">Connection Sent!</p>
          <p className="text-sm text-muted-foreground mt-1">
            You reached out as a {CONNECTION_TYPES.find(c => c.type === selectedType)?.label}
          </p>
        </div>
      )}
    </div>
  );
}

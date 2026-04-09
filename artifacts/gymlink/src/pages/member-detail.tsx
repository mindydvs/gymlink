import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetUser, useCreateConnection, useListConnections, getGetUserQueryKey, getListConnectionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Clock, Heart, Dumbbell, Brain, HandHelpingIcon, CheckCircle2, EyeOff, Eye, Video, Sparkles, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { VideoUploader } from "@/components/video-uploader";
import { useAuth } from "@/context/auth";

const CONN_TYPES = [
  { type: "crush"   as const, label: "Gym Crush",       Icon: Heart,           color: "#E8193C", desc: "You're interested in them" },
  { type: "buddy"   as const, label: "Workout Buddy",   Icon: Dumbbell,        color: "#0B9ED9", desc: "Train together" },
  { type: "advisor" as const, label: "Fitness Advisor", Icon: Brain,           color: "#12B76A", desc: "Get tips & guidance" },
  { type: "spotter" as const, label: "Spotter",         Icon: HandHelpingIcon, color: "#F79009", desc: "Help each other lift" },
];

export default function MemberDetail() {
  const [, params] = useRoute("/members/:id");
  const [, setLocation] = useLocation();
  const { userId: myId } = useAuth();
  const { data: user, isLoading } = useGetUser(params?.id ?? "", {
    query: { enabled: !!params?.id, queryKey: getGetUserQueryKey(params?.id ?? "") },
  });

  const { data: connections = [] } = useListConnections({});

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [mutualNotify, setMutualNotify] = useState(false);
  const createConn = useCreateConnection();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const profileId = params?.id ?? "";

  // Find any connection already sent from me to this user
  const sentConn = connections.find(
    (c) => c.fromUserId === myId && c.toUserId === profileId
  );
  // Find any accepted connection (either direction)
  const acceptedConn = connections.find(
    (c) =>
      c.status === "accepted" &&
      ((c.fromUserId === myId && c.toUserId === profileId) ||
       (c.toUserId === myId && c.fromUserId === profileId))
  );

  const handleConnect = () => {
    if (!selectedType || !user) return;
    const isCrush = selectedType === "crush";
    createConn.mutate(
      {
        data: {
          toUserId: user.id,
          type: selectedType as "crush" | "buddy" | "advisor" | "spotter",
          anonymous: isCrush ? anonymous : false,
          mutualNotify: isCrush ? mutualNotify : false,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
          toast({ title: "Request sent!", description: `Your ${selectedType} request has been sent` });
        },
        onError: () => toast({ title: "Error", description: "Failed to send", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <div className="space-y-5 max-w-xl">
      <Skeleton className="h-8 w-16 rounded-lg" />
      <Skeleton className="h-44 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <p className="font-bold">Member not found</p>
      <button onClick={() => setLocation("/members")} className="mt-4 text-sm" style={{ color: "hsl(var(--primary))" }}>
        Go back
      </button>
    </div>
  );

  const selected = CONN_TYPES.find((c) => c.type === selectedType);

  return (
    <div className="space-y-5 max-w-xl">
      <button
        onClick={() => setLocation("/members")}
        className="flex items-center gap-2 text-sm font-semibold transition-colors"
        style={{ color: "hsl(var(--muted-foreground))" }}
        data-testid="btn-back"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile hero */}
      <div className="card-surface p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden"
            style={{ background: "hsl(var(--secondary))" }}>
            {user.avatarUrl
              ? <img src={`/api/storage${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover" />
              : user.avatar
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold">{user.name}</h1>
              {user.verified && <span className="text-xs font-bold" style={{ color: "#0B9ED9" }}>✓ Verified</span>}
              {user.activeNow && (
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#12B76A18", color: "#12B76A" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B76A" }} />
                  Active
                </span>
              )}
            </div>
            <p className="text-sm mt-1 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{user.age} years old</p>
            <div className="flex items-center gap-4 mt-2 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.distance}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{user.schedule}</span>
            </div>
          </div>
        </div>

        <div className="divider my-4" />

        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{user.bio}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {user.interests.map((i) => (
            <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
              {i}
            </span>
          ))}
        </div>
      </div>

      {/* Connection section */}
      {acceptedConn ? (
        <div className="card-surface p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#12B76A18" }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: "#12B76A" }} />
          </div>
          <div>
            <p className="font-bold text-sm">Connected</p>
            <p className="text-[12px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              You're connected as {CONN_TYPES.find(c => c.type === acceptedConn.type)?.label ?? acceptedConn.type}
            </p>
          </div>
        </div>
      ) : (
        <div className="card-surface p-5 space-y-4">
          <p className="section-label">Connect with {user.name.split(" ")[0]}</p>

          <div className="grid grid-cols-2 gap-2.5">
            {CONN_TYPES.map(({ type, label, Icon, color, desc }) => {
              const isSelected = selectedType === type;
              const wasSent = sentConn?.type === type;
              const anyPending = !!sentConn;

              return (
                <button
                  key={type}
                  onClick={() => !anyPending && setSelectedType(type)}
                  disabled={anyPending}
                  className="p-4 rounded-lg border text-left transition-all duration-150 relative"
                  style={
                    wasSent
                      ? { borderColor: color, background: color + "18" }
                      : isSelected
                      ? { borderColor: color, background: color + "12" }
                      : { borderColor: "hsl(var(--border))", background: "transparent" }
                  }
                  data-testid={`btn-connection-type-${type}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                    style={{ background: color + (isSelected || wasSent ? "22" : "15") }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="font-bold text-[13px]" style={{ color: isSelected || wasSent ? color : undefined }}>{label}</p>
                  {wasSent ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold mt-0.5" style={{ color }}>
                      <Send className="w-3 h-3" /> Sent
                    </span>
                  ) : (
                    <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Crush options — only shown if no pending request and crush is selected */}
          {!sentConn && selectedType === "crush" && (
            <div className="space-y-2.5">
              <button
                onClick={() => setAnonymous(!anonymous)}
                className="w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all"
                style={anonymous
                  ? { borderColor: "#E8193C44", background: "#E8193C0C" }
                  : { borderColor: "hsl(var(--border))", background: "transparent" }}
                data-testid="btn-anonymous-toggle"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: anonymous ? "#E8193C20" : "hsl(var(--secondary))" }}>
                  {anonymous
                    ? <EyeOff className="w-4 h-4" style={{ color: "#E8193C" }} />
                    : <Eye className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{anonymous ? "Stay anonymous" : "Show your name"}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {anonymous ? "They won't know it's you" : "They'll see your name"}
                  </p>
                </div>
                <div className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={anonymous ? { borderColor: "#E8193C", background: "#E8193C" } : { borderColor: "hsl(var(--border))" }}>
                  {anonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                onClick={() => setMutualNotify(!mutualNotify)}
                className="w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all"
                style={mutualNotify
                  ? { borderColor: "#E8193C44", background: "#E8193C0C" }
                  : { borderColor: "hsl(var(--border))", background: "transparent" }}
                data-testid="btn-mutual-notify-toggle"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: mutualNotify ? "#E8193C20" : "hsl(var(--secondary))" }}>
                  <Sparkles className="w-4 h-4" style={{ color: mutualNotify ? "#E8193C" : "hsl(var(--muted-foreground))" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Notify me if they crush back</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {mutualNotify
                      ? "You'll both know if it's mutual — only if they opt in too"
                      : "Stay in the dark, no mutual alerts"}
                  </p>
                </div>
                <div className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={mutualNotify ? { borderColor: "#E8193C", background: "#E8193C" } : { borderColor: "hsl(var(--border))" }}>
                  {mutualNotify && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          )}

          {!sentConn && (
            <button
              onClick={handleConnect}
              disabled={!selectedType || createConn.isPending}
              className="w-full py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50"
              style={{ background: selected ? selected.color : "hsl(var(--muted))" }}
              data-testid="btn-send-connection"
            >
              {createConn.isPending ? "Sending..." : selected ? `Send as ${selected.label}` : "Choose a connection type"}
            </button>
          )}

          {sentConn && (
            <div className="flex items-center gap-2 px-1 py-0.5">
              <Send className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                Request sent — waiting for their response
              </p>
            </div>
          )}
        </div>
      )}

      {/* Workout videos */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p className="section-label">Workout Videos</p>
        </div>
        <VideoUploader userId={user.id} isOwner={false} />
      </div>
    </div>
  );
}

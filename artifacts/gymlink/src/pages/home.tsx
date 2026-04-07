import { useGetGymStats, useListNotifications, useListUsers, useRespondToConnection, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, TrendingUp, ChevronRight, Heart, Dumbbell, Brain, HandHelpingIcon, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CONN_CONFIG = {
  crush:   { label: "Gym Crush",       icon: Heart,          color: "#E8193C" },
  buddy:   { label: "Workout Buddy",   icon: Dumbbell,       color: "#0B9ED9" },
  advisor: { label: "Fitness Advisor", icon: Brain,          color: "#12B76A" },
  spotter: { label: "Spotter",         icon: HandHelpingIcon,color: "#F79009" },
};

function StatCard({ label, value, color, isLoading }: { label: string; value?: number; color: string; isLoading: boolean }) {
  return (
    <div className="card-surface p-5">
      {isLoading ? (
        <Skeleton className="h-8 w-14 mb-2" />
      ) : (
        <div className="stat-number mb-1" style={{ color }}>{value ?? 0}</div>
      )}
      <div className="section-label">{label}</div>
    </div>
  );
}

function NotifCard({ n, onAccept, onDecline, isPending }: {
  n: { id: string; type: string; fromName: string; anonymous: boolean; responded: boolean; createdAt: string };
  onAccept: () => void;
  onDecline: () => void;
  isPending: boolean;
}) {
  const cfg = CONN_CONFIG[n.type as keyof typeof CONN_CONFIG] ?? CONN_CONFIG.buddy;
  const Icon = cfg.icon;
  const isCrush = n.type === "crush";

  return (
    <div className="card-surface overflow-hidden" data-testid={`notification-${n.id}`}>
      <div className="h-0.5 w-full" style={{ background: cfg.color }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: cfg.color + "18" }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug">
              {n.anonymous ? "Someone" : n.fromName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Wants to be your {cfg.label}{n.anonymous ? " · Anonymous" : ""}
            </p>
          </div>
        </div>
        {!n.responded && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onAccept}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              style={{ background: cfg.color, color: "#fff" }}
              data-testid={`btn-accept-${n.id}`}
            >
              <Check className="w-3 h-3" />
              {isCrush ? "Crush Too!" : "Accept"}
            </button>
            <button
              onClick={onDecline}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
              data-testid={`btn-decline-${n.id}`}
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        )}
        {n.responded && (
          <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#12B76A" }}>
            <Check className="w-3 h-3" />
            Responded
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetGymStats();
  const { data: notifications = [] } = useListNotifications();
  const { data: users = [], isLoading: usersLoading } = useListUsers();
  const respond = useRespondToConnection();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unread = notifications.filter((n) => !n.read && !n.responded);
  const otherUsers = users.filter((u) => !u.isMe).slice(0, 6);

  const handleRespond = (id: string, response: "accept" | "decline") => {
    respond.mutate({ id, data: { response } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: response === "accept" ? "Connected!" : "Request declined" });
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="section-label mb-1">{stats?.gymName ?? "Your Gym"}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Now" value={stats?.activeNow} color="#12B76A" isLoading={statsLoading} />
        <StatCard label="Members" value={stats?.totalMembers} color="hsl(var(--foreground))" isLoading={statsLoading} />
        <StatCard label="Crushes" value={stats?.crushCount} color="#E8193C" isLoading={statsLoading} />
        <StatCard label="Buddies" value={stats?.buddyCount} color="#0B9ED9" isLoading={statsLoading} />
      </div>

      {/* Notifications */}
      {unread.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-sm font-bold">New Activity</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "hsl(var(--primary))" }}>
                {unread.length}
              </span>
            </div>
            <Link href="/notifications" className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unread.map((n) => (
              <NotifCard
                key={n.id}
                n={n}
                onAccept={() => handleRespond(n.id, "accept")}
                onDecline={() => handleRespond(n.id, "decline")}
                isPending={respond.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Members feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#0B9ED9" }} />
            <span className="text-sm font-bold">People at Your Gym</span>
          </div>
          <Link href="/members" className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {usersLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-lg" />)
            : otherUsers.map((user) => (
                <Link key={user.id} href={`/members/${user.id}`} data-testid={`card-user-${user.id}`}>
                  <div className="card-surface p-4 hover:border-white/15 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: "hsl(var(--secondary))" }}>
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm truncate">{user.name}</span>
                          {user.verified && <span className="text-[10px] font-bold" style={{ color: "#0B9ED9" }}>✓</span>}
                          {user.activeNow && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#12B76A" }} />
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {user.age} · {user.distance}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{user.bio}</p>
                    <div className="flex flex-wrap gap-1">
                      {user.interests.slice(0, 2).map((i) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}

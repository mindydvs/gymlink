import { useGetGymStats, useListNotifications, useListUsers, useRespondToConnection, useGetMe, useCheckIn, useListConnections, getListNotificationsQueryKey, getGetMeQueryKey, getGetGymStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Bell, TrendingUp, ChevronRight, Heart, Dumbbell, Brain, HandHelpingIcon, Check, X, MapPin, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { GymPicker } from "@/components/gym-picker";
import { useState } from "react";
import { useAuth } from "@/context/auth";

const CONN_CONFIG = {
  crush:   { label: "Gym Crush",       pluralLabel: "Crushes",  Icon: Heart,           color: "#E8193C", statKey: "crushCount"   as const },
  buddy:   { label: "Workout Buddy",   pluralLabel: "Buddies",  Icon: Dumbbell,        color: "#0B9ED9", statKey: "buddyCount"   as const },
  advisor: { label: "Fitness Advisor", pluralLabel: "Advisors", Icon: Brain,           color: "#12B76A", statKey: "advisorCount" as const },
  spotter: { label: "Spotter",         pluralLabel: "Spotters", Icon: HandHelpingIcon, color: "#F79009", statKey: "spotterCount" as const },
};

type ConnType = keyof typeof CONN_CONFIG;
type PanelKey = ConnType | "activeNow" | "members";

function NotifCard({ n, onAccept, onDecline, isPending }: {
  n: { id: string; type: string; fromName: string; anonymous: boolean; responded: boolean; createdAt: string };
  onAccept: () => void;
  onDecline: () => void;
  isPending: boolean;
}) {
  const cfg = CONN_CONFIG[n.type as ConnType] ?? CONN_CONFIG.buddy;
  const { Icon } = cfg;
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

interface MiniPerson {
  id: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string | null;
  age?: number;
  gym?: string;
  activeNow?: boolean;
}

function MemberPanel({
  title,
  subtitle,
  color,
  Icon,
  people,
  onClose,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  color: string;
  Icon: React.ElementType;
  people: MiniPerson[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-3 card-surface overflow-hidden" style={{ borderColor: color + "44" }}>
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color }} />
            <span className="font-bold text-sm">{title}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: color + "18", color }}>
              {people.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "hsl(var(--secondary))" }}
          >
            <X className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>
        {subtitle && (
          <p className="text-[11px] mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>
        )}
        {people.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "15" }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-sm font-semibold">Nobody here yet</p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Check back later</p>
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                style={{ background: "hsl(var(--secondary))" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden"
                  style={{ background: "hsl(var(--muted))" }}>
                  {p.avatarUrl
                    ? <img src={`/api/storage${p.avatarUrl}`} alt={p.name} className="w-full h-full object-cover" />
                    : p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    {p.activeNow && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#12B76A" }} />
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {p.age ? `${p.age} · ` : ""}{p.gym ?? ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            ))}
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
  const { data: me } = useGetMe();
  const { data: connections = [] } = useListConnections({ status: "accepted" });
  const { userId: myId } = useAuth();
  const respond = useRespondToConnection();
  const checkInMutation = useCheckIn();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showGymPicker, setShowGymPicker] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

  const handleCheckIn = (gymId: string, gymName: string) => {
    checkInMutation.mutate({ data: { gymId, gymName } }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGymStatsQueryKey() });
        setShowGymPicker(false);
        toast({ title: updated.checkedIn ? `Checked in at ${updated.gym}!` : "Checked out" });
      },
    });
  };

  const handleCheckOut = () => {
    if (!me?.gymId || !me?.gym) return;
    checkInMutation.mutate({ data: { gymId: me.gymId, gymName: me.gym } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGymStatsQueryKey() });
        toast({ title: "Checked out" });
      },
    });
  };

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

  const connectedByType = (type: ConnType) =>
    connections
      .filter((c) => c.type === type)
      .map((c) => {
        const other = c.fromUserId === myId ? c.toUser : c.fromUser;
        const otherId = c.fromUserId === myId ? c.toUserId : c.fromUserId;
        return { id: otherId, ...(other ?? {}) } as MiniPerson & { id: string };
      })
      .filter((x) => x.name != null);

  const allOtherUsers: MiniPerson[] = users.filter((u) => !u.isMe);
  const activeUsers: MiniPerson[] = allOtherUsers.filter((u) => u.activeNow);

  const navigateMember = (id: string) => { setActivePanel(null); setLocation(`/members/${id}`); };

  const toggle = (key: PanelKey) => setActivePanel((prev) => prev === key ? null : key);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="section-label mb-1">{stats?.gymName ?? "Your Gym"}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
      </div>

      {/* Check-in card */}
      <div className="card-surface p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: me?.checkedIn ? "#12B76A18" : "hsl(var(--secondary))" }}>
            <MapPin className="w-4 h-4" style={{ color: me?.checkedIn ? "#12B76A" : "hsl(var(--muted-foreground))" }} />
          </div>
          <div className="flex-1 min-w-0">
            {me?.checkedIn ? (
              <>
                <p className="text-sm font-bold">Checked in</p>
                <p className="text-[11px] font-medium" style={{ color: "#12B76A" }}>{me.gym}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">Not checked in</p>
                <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Let people know you're at the gym</p>
              </>
            )}
          </div>
          {me?.checkedIn ? (
            <button
              onClick={handleCheckOut}
              disabled={checkInMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
            >
              Check Out
            </button>
          ) : (
            <button
              onClick={() => setShowGymPicker(!showGymPicker)}
              disabled={checkInMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
              style={{ background: "#12B76A" }}
            >
              Check In
            </button>
          )}
        </div>
        {showGymPicker && !me?.checkedIn && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <p className="section-label mb-2">Select gym</p>
            <GymPicker
              value={me?.gymId ?? ""}
              selectedGymName={me?.gym}
              onChange={handleCheckIn}
            />
          </div>
        )}
      </div>

      {/* Activity stats — now clickable */}
      <div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggle("activeNow")}
            className="card-surface p-5 text-left transition-all duration-150 hover:scale-[1.02]"
            style={activePanel === "activeNow" ? { borderColor: "#12B76A", boxShadow: "0 0 0 1px #12B76A40" } : {}}
            data-testid="btn-stat-activeNow"
          >
            {statsLoading ? <Skeleton className="h-8 w-14 mb-2" /> : (
              <div className="stat-number mb-1" style={{ color: "#12B76A" }}>{stats?.activeNow ?? 0}</div>
            )}
            <div className="flex items-center justify-between">
              <div className="section-label">Active Now</div>
              <Zap className="w-3.5 h-3.5 opacity-50" style={{ color: "#12B76A" }} />
            </div>
          </button>
          <button
            onClick={() => toggle("members")}
            className="card-surface p-5 text-left transition-all duration-150 hover:scale-[1.02]"
            style={activePanel === "members" ? { borderColor: "hsl(var(--primary))", boxShadow: "0 0 0 1px hsl(var(--primary) / 0.25)" } : {}}
            data-testid="btn-stat-members"
          >
            {statsLoading ? <Skeleton className="h-8 w-14 mb-2" /> : (
              <div className="stat-number mb-1">{stats?.totalMembers ?? 0}</div>
            )}
            <div className="flex items-center justify-between">
              <div className="section-label">Members</div>
              <Users className="w-3.5 h-3.5 opacity-50" style={{ color: "hsl(var(--foreground))" }} />
            </div>
          </button>
        </div>

        {activePanel === "activeNow" && (
          <MemberPanel
            title="Active Now"
            subtitle="People currently at the gym"
            color="#12B76A"
            Icon={Zap}
            people={activeUsers}
            onClose={() => setActivePanel(null)}
            onSelect={navigateMember}
          />
        )}
        {activePanel === "members" && (
          <MemberPanel
            title="All Members"
            color="hsl(var(--primary))"
            Icon={Users}
            people={allOtherUsers}
            onClose={() => setActivePanel(null)}
            onSelect={navigateMember}
          />
        )}
      </div>

      {/* Connection stats (clickable) */}
      <div>
        <p className="section-label mb-3">Your Connections</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(CONN_CONFIG) as [ConnType, typeof CONN_CONFIG[ConnType]][]).map(([type, cfg]) => {
            const count = stats?.[cfg.statKey] ?? 0;
            const isActive = activePanel === type;
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className="card-surface p-5 text-left transition-all duration-150 hover:scale-[1.02]"
                style={isActive ? { borderColor: cfg.color, boxShadow: `0 0 0 1px ${cfg.color}40` } : {}}
                data-testid={`btn-stat-${type}`}
              >
                {statsLoading ? <Skeleton className="h-8 w-14 mb-2" /> : (
                  <div className="stat-number mb-1" style={{ color: cfg.color }}>{count}</div>
                )}
                <div className="flex items-center justify-between">
                  <div className="section-label">{cfg.pluralLabel}</div>
                  <cfg.Icon className="w-3.5 h-3.5 opacity-50" style={{ color: cfg.color }} />
                </div>
              </button>
            );
          })}
        </div>

        {activePanel && activePanel in CONN_CONFIG && (() => {
          const cfg = CONN_CONFIG[activePanel as ConnType];
          const people = connectedByType(activePanel as ConnType);
          return (
            <MemberPanel
              title={cfg.pluralLabel}
              color={cfg.color}
              Icon={cfg.Icon}
              people={people}
              onClose={() => setActivePanel(null)}
              onSelect={navigateMember}
            />
          );
        })()}
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
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                        style={{ background: "hsl(var(--secondary))" }}>
                        {user.avatarUrl
                          ? <img src={`/api/storage${user.avatarUrl}`} alt={user.name} className="w-full h-full object-cover" />
                          : user.avatar}
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

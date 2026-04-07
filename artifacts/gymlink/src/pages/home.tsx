import { useGetGymStats, useListNotifications, useListUsers, useRespondToConnection, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Heart, Dumbbell, HandHelpingIcon, Brain, Bell, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CONNECTION_COLORS: Record<string, string> = {
  crush: "#FF3366",
  buddy: "#3B82F6",
  advisor: "#10B981",
  spotter: "#F59E0B",
};

const CONNECTION_LABELS: Record<string, string> = {
  crush: "Gym Crush",
  buddy: "Workout Buddy",
  advisor: "Fitness Advisor",
  spotter: "Spotter",
};

const CONNECTION_ICONS: Record<string, React.ElementType> = {
  crush: Heart,
  buddy: Dumbbell,
  advisor: Brain,
  spotter: HandHelpingIcon,
};

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-1">
      <span className="text-3xl font-black" style={{ color }}>
        {value ?? <Skeleton className="h-8 w-12" />}
      </span>
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function NotificationItem({ notification, onRespond }: {
  notification: { id: string; type: string; fromName: string; anonymous: boolean; responded: boolean; createdAt: string };
  onRespond: (id: string, response: string) => void;
}) {
  const color = CONNECTION_COLORS[notification.type] ?? "#888";
  const label = CONNECTION_LABELS[notification.type] ?? notification.type;
  const Icon = CONNECTION_ICONS[notification.type] ?? Bell;

  return (
    <div
      className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-3"
      style={{ borderLeft: `3px solid ${color}` }}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-snug">
            {notification.anonymous ? "Someone" : notification.fromName} marked you as their {label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.createdAt).toRelativeString?.() ?? "Recently"}{notification.anonymous ? " · Anonymous" : ""}
          </p>
        </div>
      </div>
      {!notification.responded && (
        <div className="flex gap-2">
          {notification.type === "crush" ? (
            <Button
              size="sm"
              onClick={() => onRespond(notification.id, "accept")}
              className="text-xs font-bold"
              style={{ background: color + "33", color, border: `1px solid ${color}55` }}
              data-testid={`btn-crush-too-${notification.id}`}
            >
              Crush Too!
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onRespond(notification.id, "accept")}
              className="text-xs font-bold"
              style={{ background: color + "33", color, border: `1px solid ${color}55` }}
              data-testid={`btn-accept-${notification.id}`}
            >
              Accept
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRespond(notification.id, "decline")}
            className="text-xs text-muted-foreground"
            data-testid={`btn-decline-${notification.id}`}
          >
            Decline
          </Button>
        </div>
      )}
      {notification.responded && (
        <span className="text-xs text-muted-foreground">Responded</span>
      )}
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetGymStats();
  const { data: notifications = [], isLoading: notifsLoading } = useListNotifications();
  const { data: users = [], isLoading: usersLoading } = useListUsers();
  const respondToConnection = useRespondToConnection();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unreadNotifications = notifications.filter((n) => !n.read && !n.responded);
  const otherUsers = users.filter((u) => !u.isMe).slice(0, 4);

  const handleRespond = (notifId: string, response: string) => {
    respondToConnection.mutate(
      { id: notifId, data: { response: response as "accept" | "decline" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          toast({ title: response === "accept" ? "Connection accepted!" : "Declined", description: response === "accept" ? "You're now connected." : "" });
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">{stats?.gymName ?? "Your Gym"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Now" value={stats?.activeNow} color="#10B981" />
        <StatCard label="Total Members" value={stats?.totalMembers} color="#3B82F6" />
        <StatCard label="Gym Crushes" value={stats?.crushCount} color="#FF3366" />
        <StatCard label="Buddies" value={stats?.buddyCount} color="#F59E0B" />
      </div>

      {unreadNotifications.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-neon-crush" />
            <h2 className="text-lg font-bold">New Activity</h2>
            <span className="ml-1 w-5 h-5 rounded-full bg-neon-crush flex items-center justify-center text-[10px] font-black text-white">
              {unreadNotifications.length}
            </span>
          </div>
          <div className="space-y-3">
            {unreadNotifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRespond={handleRespond} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-buddy" />
            <h2 className="text-lg font-bold">People at Your Gym</h2>
          </div>
          <Link href="/members" className="text-sm text-neon-buddy hover:text-neon-buddy/80 font-semibold">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {usersLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            : otherUsers.map((user) => (
                <Link key={user.id} href={`/members/${user.id}`} data-testid={`card-user-${user.id}`}>
                  <div className="bg-card border border-border/50 rounded-2xl p-4 hover:border-white/20 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-muted to-muted/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">{user.name}</span>
                          {user.verified && (
                            <span className="text-neon-buddy text-xs">✓</span>
                          )}
                          {user.activeNow && (
                            <span className="w-2 h-2 rounded-full bg-neon-advisor shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.age} · {user.distance}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {user.interests.slice(0, 2).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                          {interest}
                        </Badge>
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

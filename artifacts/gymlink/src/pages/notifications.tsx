import { useListNotifications, useRespondToConnection, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, Dumbbell, Brain, HandHelpingIcon, Check, X, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CONN_CONFIG = {
  crush:   { label: "Gym Crush",       Icon: Heart,           color: "#E8193C" },
  buddy:   { label: "Workout Buddy",   Icon: Dumbbell,        color: "#0B9ED9" },
  advisor: { label: "Fitness Advisor", Icon: Brain,           color: "#12B76A" },
  spotter: { label: "Spotter",         Icon: HandHelpingIcon, color: "#F79009" },
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useListNotifications();
  const respond = useRespondToConnection();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const handleRespond = (id: string, response: "accept" | "decline") => {
    respond.mutate({ id, data: { response } }, {
      onSuccess: () => { invalidate(); toast({ title: response === "accept" ? "Connected!" : "Declined" }); },
    });
  };

  const handleDismiss = (id: string) => {
    markRead.mutate({ id }, { onSuccess: invalidate });
  };

  const unread = notifications.filter((n) => !n.read);
  const older = notifications.filter((n) => n.read);

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">
          {unread.length > 0 ? `${unread.length} New` : "All clear"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--secondary))" }}>
            <Bell className="w-6 h-6" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <p className="font-bold">No notifications</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            When someone reaches out, it'll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <p className="section-label mb-3">New</p>
              <div className="space-y-2.5">
                {unread.map((n) => {
                  const cfg = CONN_CONFIG[n.type as keyof typeof CONN_CONFIG] ?? CONN_CONFIG.buddy;
                  const { Icon, color, label } = cfg;
                  const isCrush = n.type === "crush";

                  return (
                    <div key={n.id} className="card-surface overflow-hidden" data-testid={`notification-${n.id}`}>
                      <div className="h-0.5" style={{ background: color }} />
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: color + "18" }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{n.anonymous ? "Anonymous" : n.fromName}</p>
                            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                              Wants to be your {label}
                              {n.anonymous ? " · Hidden identity" : ""}
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>

                        {!n.responded ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRespond(n.id, "accept")}
                              disabled={respond.isPending}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold text-white"
                              style={{ background: color }}
                              data-testid={`btn-accept-${n.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {isCrush ? "Crush Too!" : "Accept"}
                            </button>
                            <button
                              onClick={() => handleRespond(n.id, "decline")}
                              disabled={respond.isPending}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold"
                              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
                              data-testid={`btn-decline-${n.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Decline
                            </button>
                            <button
                              onClick={() => handleDismiss(n.id)}
                              className="ml-auto text-[11px] font-semibold"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                              data-testid={`btn-dismiss-${n.id}`}
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#12B76A" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Responded
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {older.length > 0 && (
            <section>
              <p className="section-label mb-3">Earlier</p>
              <div className="space-y-2 opacity-60">
                {older.map((n) => {
                  const cfg = CONN_CONFIG[n.type as keyof typeof CONN_CONFIG] ?? CONN_CONFIG.buddy;
                  const { Icon, color, label } = cfg;
                  return (
                    <div key={n.id} className="card-surface px-4 py-3 flex items-center gap-3" data-testid={`notification-read-${n.id}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: color + "15" }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{n.anonymous ? "Anonymous" : n.fromName}</p>
                        <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
                      </div>
                      {n.responded && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#12B76A" }} />}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

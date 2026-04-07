import { useListNotifications, useRespondToConnection, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, Dumbbell, Brain, HandHelpingIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CONNECTION_TYPES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  crush: { label: "Gym Crush", icon: Heart, color: "#FF3366" },
  buddy: { label: "Workout Buddy", icon: Dumbbell, color: "#3B82F6" },
  advisor: { label: "Fitness Advisor", icon: Brain, color: "#10B981" },
  spotter: { label: "Spotter", icon: HandHelpingIcon, color: "#F59E0B" },
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useListNotifications();
  const respondToConnection = useRespondToConnection();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRespond = (notifId: string, response: "accept" | "decline") => {
    respondToConnection.mutate(
      { id: notifId, data: { response } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          toast({
            title: response === "accept" ? "Accepted!" : "Declined",
            description: response === "accept" ? "Connection accepted." : "",
          });
        },
      }
    );
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) }
    );
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          {unread.length > 0 ? `${unread.length} new` : "All caught up"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No notifications yet</p>
          <p className="text-sm mt-1">When someone connects with you, it shows up here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">New</h2>
              <div className="space-y-3">
                {unread.map((n) => {
                  const conn = CONNECTION_TYPES[n.type] ?? CONNECTION_TYPES.buddy;
                  const Icon = conn.icon;
                  return (
                    <div
                      key={n.id}
                      className="bg-card rounded-2xl p-4 space-y-3"
                      style={{ border: `1px solid ${conn.color}33`, borderLeft: `3px solid ${conn.color}` }}
                      data-testid={`notification-${n.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: conn.color + "22" }}>
                          <Icon className="w-5 h-5" style={{ color: conn.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {n.anonymous ? "Someone" : n.fromName} marked you as their {conn.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                            {n.anonymous ? " · Anonymous" : ""}
                          </p>
                        </div>
                      </div>
                      {!n.responded ? (
                        <div className="flex gap-2">
                          {n.type === "crush" ? (
                            <Button
                              size="sm"
                              className="text-xs font-bold"
                              style={{ background: conn.color + "33", color: conn.color, border: `1px solid ${conn.color}55` }}
                              onClick={() => handleRespond(n.id, "accept")}
                              disabled={respondToConnection.isPending}
                              data-testid={`btn-crush-too-${n.id}`}
                            >
                              Crush Too!
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="text-xs font-bold"
                              style={{ background: conn.color + "33", color: conn.color, border: `1px solid ${conn.color}55` }}
                              onClick={() => handleRespond(n.id, "accept")}
                              disabled={respondToConnection.isPending}
                              data-testid={`btn-accept-${n.id}`}
                            >
                              Accept
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground"
                            onClick={() => handleRespond(n.id, "decline")}
                            disabled={respondToConnection.isPending}
                            data-testid={`btn-decline-${n.id}`}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground ml-auto"
                            onClick={() => handleMarkRead(n.id)}
                            data-testid={`btn-mark-read-${n.id}`}
                          >
                            Dismiss
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-[#10B981]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Responded</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Earlier</h2>
              <div className="space-y-3 opacity-60">
                {read.map((n) => {
                  const conn = CONNECTION_TYPES[n.type] ?? CONNECTION_TYPES.buddy;
                  const Icon = conn.icon;
                  return (
                    <div
                      key={n.id}
                      className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3"
                      data-testid={`notification-read-${n.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: conn.color + "22" }}>
                        <Icon className="w-4 h-4" style={{ color: conn.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {n.anonymous ? "Someone" : n.fromName} · {conn.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {n.responded && (
                        <CheckCircle className="w-4 h-4 text-[#10B981] ml-auto shrink-0" />
                      )}
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

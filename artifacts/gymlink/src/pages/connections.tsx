import { useState } from "react";
import { useListConnections, getListConnectionsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Heart, Dumbbell, Brain, HandHelpingIcon, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { key: "", label: "All", color: "#ffffff" },
  { key: "crush", label: "Crushes", icon: Heart, color: "#FF3366" },
  { key: "buddy", label: "Buddies", icon: Dumbbell, color: "#3B82F6" },
  { key: "advisor", label: "Advisors", icon: Brain, color: "#10B981" },
  { key: "spotter", label: "Spotters", icon: HandHelpingIcon, color: "#F59E0B" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#10B981",
  declined: "#888",
};

export default function Connections() {
  const [activeTab, setActiveTab] = useState("");
  const { data: connections = [], isLoading } = useListConnections(
    activeTab ? { type: activeTab as "crush" | "buddy" | "advisor" | "spotter" } : undefined,
    { query: { queryKey: getListConnectionsQueryKey(activeTab ? { type: activeTab as "crush" | "buddy" | "advisor" | "spotter" } : undefined) } }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Connections</h1>
        <p className="text-muted-foreground mt-1">Your gym network</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold shrink-0 transition-all ${activeTab === tab.key ? "text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            style={activeTab === tab.key ? { background: tab.color, color: tab.key ? "white" : "black" } : undefined}
            data-testid={`tab-${tab.key || "all"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No connections yet</p>
          <p className="text-sm mt-1">
            <Link href="/members" className="text-neon-buddy hover:underline">Find members</Link> to connect with
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => {
            const isOutgoing = connection.fromUserId === "me";
            const otherUser = isOutgoing ? connection.toUser : connection.fromUser;
            const typeColor = { crush: "#FF3366", buddy: "#3B82F6", advisor: "#10B981", spotter: "#F59E0B" }[connection.type] ?? "#888";

            return (
              <div
                key={connection.id}
                className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4"
                data-testid={`connection-${connection.id}`}
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                  {otherUser?.avatar ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{otherUser?.name ?? "Unknown"}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize shrink-0"
                      style={{ borderColor: typeColor + "44", color: typeColor, background: typeColor + "11" }}
                    >
                      {connection.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: STATUS_COLORS[connection.status] }}>
                      {connection.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isOutgoing ? "You reached out" : "They reached out"}
                    </span>
                    {connection.anonymous && (
                      <span className="text-xs text-muted-foreground">· Anonymous</span>
                    )}
                  </div>
                </div>
                {otherUser && (
                  <Link href={`/members/${otherUser.id}`}>
                    <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`btn-view-${connection.id}`}>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

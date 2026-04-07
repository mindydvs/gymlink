import { useState } from "react";
import { useListConnections, getListConnectionsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Heart, Dumbbell, Brain, HandHelpingIcon, Users, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { key: "",         label: "All" },
  { key: "crush",    label: "Crushes",  Icon: Heart,           color: "#E8193C" },
  { key: "buddy",    label: "Buddies",  Icon: Dumbbell,        color: "#0B9ED9" },
  { key: "advisor",  label: "Advisors", Icon: Brain,           color: "#12B76A" },
  { key: "spotter",  label: "Spotters", Icon: HandHelpingIcon, color: "#F79009" },
];

const TYPE_COLORS: Record<string, string> = {
  crush: "#E8193C", buddy: "#0B9ED9", advisor: "#12B76A", spotter: "#F79009",
};

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending:  { text: "Pending",  color: "#F79009" },
  accepted: { text: "Connected",color: "#12B76A" },
  declined: { text: "Declined", color: "hsl(var(--muted-foreground))" },
};

export default function Connections() {
  const [activeTab, setActiveTab] = useState("");
  const params = activeTab ? { type: activeTab as "crush" | "buddy" | "advisor" | "spotter" } : undefined;

  const { data: connections = [], isLoading } = useListConnections(params, {
    query: { queryKey: getListConnectionsQueryKey(params) },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">My Network</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Connections</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all"
              style={active
                ? { background: (tab as { color?: string }).color ?? "hsl(var(--primary))", color: "#fff" }
                : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
              data-testid={`tab-${tab.key || "all"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-lg" />)}
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--secondary))" }}>
            <Users className="w-6 h-6" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <p className="font-bold">No connections yet</p>
          <Link href="/members" className="text-sm mt-2 font-semibold" style={{ color: "hsl(var(--primary))" }}>
            Find members to connect with
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((c) => {
            const isOut = c.fromUserId === "me";
            const other = isOut ? c.toUser : c.fromUser;
            const typeColor = TYPE_COLORS[c.type] ?? "#888";
            const statusCfg = STATUS_LABELS[c.status] ?? STATUS_LABELS.pending;

            return (
              <div key={c.id} className="card-surface px-4 py-3.5 flex items-center gap-3" data-testid={`connection-${c.id}`}>
                {/* Type accent bar */}
                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: typeColor }} />

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "hsl(var(--secondary))" }}>
                  {other?.avatar ?? "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{other?.name ?? "Unknown"}</span>
                    <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-md"
                      style={{ background: typeColor + "18", color: typeColor }}>
                      {c.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: statusCfg.color }}>{statusCfg.text}</span>
                    <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>·</span>
                    <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {isOut ? "You sent this" : "They sent this"}
                    </span>
                    {c.anonymous && (
                      <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>· Anon</span>
                    )}
                  </div>
                </div>

                {other && (
                  <Link href={`/members/${other.id}`}>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
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

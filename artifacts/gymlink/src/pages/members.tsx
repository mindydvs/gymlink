import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Clock, MapPin, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Members() {
  const [search, setSearch] = useState("");
  const [filterInterest, setFilterInterest] = useState("");

  const { data: users = [], isLoading } = useListUsers(
    { search: search || undefined },
    { query: { queryKey: getListUsersQueryKey({ search: search || undefined }) } }
  );

  const otherUsers = users.filter((u) => !u.isMe);
  const allInterests = Array.from(new Set(otherUsers.flatMap((u) => u.interests)));
  const filtered = filterInterest ? otherUsers.filter((u) => u.interests.includes(filterInterest)) : otherUsers;

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Discover</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Members</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <Input
          type="search"
          placeholder="Search members..."
          className="pl-10 h-10 text-sm"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {/* Filters */}
      {allInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["", ...allInterests.slice(0, 8)].map((interest) => {
            const active = filterInterest === interest;
            return (
              <button
                key={interest || "all"}
                onClick={() => setFilterInterest(interest)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={active
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
                data-testid={`filter-${interest || "all"}`}
              >
                {interest || "All"}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--secondary))" }}>
            <Users className="w-6 h-6" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <p className="font-bold">No members found</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Try a different search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <Link key={user.id} href={`/members/${user.id}`} data-testid={`card-member-${user.id}`}>
              <div className="card-surface p-5 hover:border-white/15 transition-all cursor-pointer group h-full flex flex-col">
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "hsl(var(--secondary))" }}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[15px] leading-tight">{user.name}</span>
                      {user.verified && <span className="text-[10px] font-bold" style={{ color: "#0B9ED9" }}>✓</span>}
                      {user.activeNow && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#12B76A" }} />
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {user.age} years old
                    </p>
                  </div>
                </div>

                <p className="text-[13px] flex-1 mb-4 line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {user.bio}
                </p>

                {/* Interests */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {user.interests.slice(0, 3).map((interest) => (
                    <span key={interest} className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                      {interest}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="divider mb-3" />
                <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{user.schedule}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.distance}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

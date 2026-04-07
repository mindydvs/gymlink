import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Users, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  const filtered = filterInterest
    ? otherUsers.filter((u) => u.interests.includes(filterInterest))
    : otherUsers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Members</h1>
        <p className="text-muted-foreground mt-1">People at your gym right now</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search members..."
          className="pl-10 bg-card border-border/50 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {allInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterInterest("")}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${!filterInterest ? "bg-white text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            data-testid="filter-all"
          >
            All
          </button>
          {allInterests.slice(0, 8).map((interest) => (
            <button
              key={interest}
              onClick={() => setFilterInterest(filterInterest === interest ? "" : interest)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${filterInterest === interest ? "bg-white text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              data-testid={`filter-${interest}`}
            >
              {interest}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((user) => (
            <Link key={user.id} href={`/members/${user.id}`} data-testid={`card-member-${user.id}`}>
              <div className="bg-card border border-border/50 rounded-2xl p-5 hover:border-white/20 transition-all duration-200 group cursor-pointer h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-muted to-muted/30 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg leading-tight truncate">{user.name}</span>
                      {user.verified && <span className="text-[#3B82F6] text-xs font-bold">✓</span>}
                      {user.activeNow && (
                        <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.age} yrs old</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">{user.bio}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {user.interests.slice(0, 3).map((interest) => (
                    <Badge key={interest} variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                      {interest}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{user.schedule}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.distance}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No members found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}

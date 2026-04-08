import { useState } from "react";
import { useListGyms } from "@workspace/api-client-react";
import { Search, Check, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Gym } from "@workspace/api-client-react";

interface GymPickerProps {
  value: string;
  onChange: (gymId: string, gymName: string) => void;
  selectedGymName?: string;
}

export function GymPicker({ value, onChange, selectedGymName }: GymPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: gyms = [] } = useListGyms();

  const filtered = search
    ? gyms.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : gyms;

  const selectedGym = gyms.find((g) => g.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-11 px-3 rounded-lg border text-sm font-medium text-left flex items-center gap-2 transition-all"
        style={{
          background: "hsl(var(--input))",
          border: `1px solid ${open ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
          color: selectedGym ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Building2 className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
        <span className="flex-1 truncate">
          {selectedGym?.name ?? selectedGymName ?? "Select a gym..."}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border overflow-hidden shadow-xl"
          style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--popover-border))" }}>
          <div className="p-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
              <Input
                placeholder="Search gyms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((gym) => {
              const isSelected = gym.id === value;
              return (
                <button
                  key={gym.id}
                  type="button"
                  onClick={() => {
                    onChange(gym.id, gym.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-left transition-colors hover:bg-white/5"
                  style={isSelected ? { background: "hsl(var(--primary) / 0.1)" } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{gym.name}</p>
                    <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {gym.address} · {gym.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No gyms found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

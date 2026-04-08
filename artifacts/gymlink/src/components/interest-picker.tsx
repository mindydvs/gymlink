import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const PRESETS = [
  "Powerlifting", "Bodybuilding", "CrossFit", "Running", "Yoga", "HIIT",
  "Nutrition", "Cardio", "Flexibility", "Kettlebells", "Boxing", "Cycling",
  "Swimming", "Pilates", "Calisthenics", "Olympic Lifting", "Mobility",
  "Meal Prep", "Posing", "Jump Rope", "Functional Training", "Beginner Lifting",
];

interface InterestPickerProps {
  value: string[];
  onChange: (interests: string[]) => void;
}

export function InterestPicker({ value, onChange }: InterestPickerProps) {
  const [custom, setCustom] = useState("");

  const toggle = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCustom("");
    }
  };

  const customInterests = value.filter((i) => !PRESETS.includes(i));

  return (
    <div className="space-y-4">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((interest) => {
          const selected = value.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={selected
                ? { background: "hsl(var(--primary))", color: "#fff" }
                : { background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }
              }
            >
              {selected && "✓ "}{interest}
            </button>
          );
        })}
      </div>

      {/* Custom interests */}
      {customInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customInterests.map((i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}>
              {i}
              <button type="button" onClick={() => toggle(i)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom interest..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          className="h-9 text-sm flex-1"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-3 h-9 rounded-lg flex items-center gap-1 text-sm font-semibold disabled:opacity-40 transition-all"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

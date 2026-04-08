import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type ConnectionType = "crush" | "buddy" | "advisor" | "spotter";

const LABELS: Record<ConnectionType, string> = {
  crush: "Gym Crush",
  buddy: "Workout Buddy",
  advisor: "Fitness Advisor",
  spotter: "Spotter",
};

interface ConnectionBadgeProps {
  type: ConnectionType;
  small?: boolean;
}

export function ConnectionBadge({ type, small = false }: ConnectionBadgeProps) {
  const colors = useColors();
  const color = colors[type] as string;

  return (
    <View
      style={[
        styles.badge,
        small ? styles.small : styles.normal,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <Text
        style={[
          styles.label,
          small ? styles.labelSmall : styles.labelNormal,
          { color },
        ]}
      >
        {LABELS[type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  normal: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
  labelNormal: {
    fontSize: 12,
  },
  labelSmall: {
    fontSize: 10,
  },
});

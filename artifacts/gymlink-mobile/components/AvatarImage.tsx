import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarImageProps {
  avatarUrl?: string | null;
  avatarEmoji?: string;
  size?: number;
  style?: object;
}

export function AvatarImage({ avatarUrl, avatarEmoji, size = 48, style }: AvatarImageProps) {
  const colors = useColors();

  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.base,
          { width: size, height: size, borderRadius },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.emojiContainer,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{avatarEmoji ?? "💪"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  emojiContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

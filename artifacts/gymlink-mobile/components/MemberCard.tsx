import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AvatarImage } from "@/components/AvatarImage";
import { useColors } from "@/hooks/useColors";

interface MemberCardProps {
  id: string;
  name: string;
  age: number;
  avatar: string;
  avatarUrl?: string | null;
  bio: string;
  interests: string[];
  activeNow?: boolean;
  checkedIn?: boolean;
  verified?: boolean;
  onPress?: () => void;
}

export function MemberCard({
  name,
  age,
  avatar,
  avatarUrl,
  bio,
  interests,
  activeNow,
  checkedIn,
  verified,
  onPress,
}: MemberCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <AvatarImage
            avatarUrl={avatarUrl}
            avatarEmoji={avatar}
            size={52}
          />
          {(activeNow || checkedIn) && (
            <View
              style={[styles.dot, { backgroundColor: colors.advisor }]}
            />
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {name}
            </Text>
            {verified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.buddy} />
            )}
            <Text style={[styles.age, { color: colors.mutedForeground }]}>
              {age}
            </Text>
          </View>

          <Text
            style={[styles.bio, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {bio}
          </Text>

          {interests.length > 0 && (
            <View style={styles.tags}>
              {interests.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  dot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  age: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginLeft: 2,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  tag: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});

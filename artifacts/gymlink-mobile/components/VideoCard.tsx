import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useToggleVideoLike } from "@workspace/api-client-react";

interface VideoCardProps {
  id: string;
  title: string;
  uploaderName: string;
  uploaderAvatar?: React.ReactNode;
  createdAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  onPress?: () => void;
}

export function VideoCard({
  id,
  title,
  uploaderName,
  uploaderAvatar,
  createdAt,
  likeCount: initialLikeCount = 0,
  likedByMe: initialLikedByMe = false,
  onPress,
}: VideoCardProps) {
  const colors = useColors();
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const { mutate: toggleLike, isPending } = useToggleVideoLike();

  const liked = optimisticLiked ?? initialLikedByMe;
  const count = optimisticCount ?? initialLikeCount;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleLike = () => {
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setOptimisticLiked(newLiked);
    setOptimisticCount(newCount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(
      { id },
      {
        onError: () => {
          setOptimisticLiked(!newLiked);
          setOptimisticCount(count);
        },
        onSuccess: (data) => {
          setOptimisticLiked(data.likedByMe);
          setOptimisticCount(data.likeCount);
        },
      }
    );
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="videocam" size={28} color={colors.primary} />
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View style={styles.meta}>
          {uploaderAvatar}
          <Text style={[styles.uploader, { color: colors.mutedForeground }]}>
            {uploaderName} · {timeAgo(createdAt)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleLike}
        style={styles.likeBtn}
        hitSlop={12}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? colors.primary : colors.mutedForeground}
            />
            {count > 0 && (
              <Text
                style={[
                  styles.likeCount,
                  { color: liked ? colors.primary : colors.mutedForeground },
                ]}
              >
                {count}
              </Text>
            )}
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(232,25,60,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploader: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
  },
  likeBtn: {
    alignItems: "center",
    gap: 2,
    minWidth: 32,
  },
  likeCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
});

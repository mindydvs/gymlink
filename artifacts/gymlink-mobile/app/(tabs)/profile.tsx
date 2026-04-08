import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarImage } from "@/components/AvatarImage";
import { VideoCard } from "@/components/VideoCard";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useGetMe,
  useListWorkoutVideos,
  useListConnections,
} from "@workspace/api-client-react";
import { router } from "expo-router";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const {
    data: me,
    isLoading,
    refetch,
    isRefetching,
  } = useGetMe();

  const { data: videos, refetch: refetchVideos } = useListWorkoutVideos({ userId });
  const { data: connections } = useListConnections({ status: "accepted" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const connectionCount = connections?.length ?? 0;

  return (
    <FlatList
      data={videos ?? []}
      keyExtractor={(item) => item.id}
      scrollEnabled={!!(videos?.length)}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.list,
        { paddingTop: topPad, paddingBottom: Platform.OS === "web" ? 34 : 0 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            refetchVideos();
          }}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        isLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
        ) : me ? (
          <View style={styles.profileHeader}>
            <View style={styles.heroRow}>
              <AvatarImage
                avatarUrl={me.avatarUrl}
                avatarEmoji={me.avatar}
                size={80}
              />
              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>
                    {videos?.length ?? 0}
                  </Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                    Videos
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>
                    {connectionCount}
                  </Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                    Connections
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {me.name}
                </Text>
                {me.verified && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.buddy} />
                )}
                <Text style={[styles.age, { color: colors.mutedForeground }]}>
                  {me.age}
                </Text>
              </View>

              <View style={styles.gymRow}>
                <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.gym, { color: colors.mutedForeground }]}>
                  {me.gym}
                </Text>
                {me.checkedIn && (
                  <View style={[styles.checkinPill, { backgroundColor: `${colors.advisor}22`, borderColor: `${colors.advisor}55` }]}>
                    <View style={[styles.checkinDot, { backgroundColor: colors.advisor }]} />
                    <Text style={[styles.checkinText, { color: colors.advisor }]}>
                      Here now
                    </Text>
                  </View>
                )}
              </View>

              {me.bio ? (
                <Text style={[styles.bio, { color: colors.mutedForeground }]}>
                  {me.bio}
                </Text>
              ) : null}

              {me.interests.length > 0 && (
                <View style={styles.tags}>
                  {me.interests.map((tag) => (
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

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              My Videos
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.empty}>
            <Ionicons name="videocam-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No videos yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
              Upload your first workout video from the web app
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <VideoCard
          id={item.id}
          title={item.title}
          uploaderName={me?.name ?? "You"}
          createdAt={item.createdAt}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    gap: 12,
    paddingTop: 20,
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  heroStats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLbl: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 32,
  },
  nameSection: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  age: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginLeft: 2,
  },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  gym: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  checkinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  checkinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkinText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 2,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    marginTop: 40,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  emptySubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
});

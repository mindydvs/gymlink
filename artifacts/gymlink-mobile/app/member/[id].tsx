import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarImage } from "@/components/AvatarImage";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { VideoCard } from "@/components/VideoCard";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useGetUser,
  useListWorkoutVideos,
  useListConnections,
  useCreateConnection,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CONNECTION_TYPES = [
  { type: "crush" as const, label: "Gym Crush", icon: "heart-outline" as const, anonymous: true },
  { type: "buddy" as const, label: "Workout Buddy", icon: "fitness-outline" as const, anonymous: false },
  { type: "advisor" as const, label: "Fitness Advisor", icon: "school-outline" as const, anonymous: false },
  { type: "spotter" as const, label: "Spotter", icon: "hand-right-outline" as const, anonymous: false },
];

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const queryClient = useQueryClient();

  const [showConnectMenu, setShowConnectMenu] = useState(false);

  const {
    data: member,
    isLoading,
    refetch,
    isRefetching,
  } = useGetUser(id ?? "");

  const { data: videos, refetch: refetchVideos } = useListWorkoutVideos({
    userId: id ?? "",
  });

  const { data: connections } = useListConnections({ status: "accepted" });
  const { mutate: createConnection, isPending: connecting } = useCreateConnection();

  const isMe = id === userId;

  const existingConn = connections?.find(
    (c) =>
      (c.fromUserId === userId && c.toUserId === id) ||
      (c.toUserId === userId && c.fromUserId === id)
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleConnect = (type: "crush" | "buddy" | "advisor" | "spotter", anonymous: boolean) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConnectMenu(false);
    createConnection(
      { data: { toUserId: id, type, anonymous } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listConnections"] });
          Alert.alert("Request Sent", `Your ${type} request has been sent!`);
        },
        onError: () => {
          Alert.alert("Error", "Failed to send connection request");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Member not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]} numberOfLines={1}>
          {member.name}
        </Text>
        {!isMe && !existingConn && (
          <Pressable
            onPress={() => setShowConnectMenu(true)}
            style={[styles.connectBtn, { backgroundColor: colors.primary }]}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="person-add-outline" size={16} color="#fff" />
            )}
          </Pressable>
        )}
        {existingConn && (
          <View style={styles.connectedBadge}>
            <ConnectionBadge
              type={existingConn.type as "crush" | "buddy" | "advisor" | "spotter"}
              small
            />
          </View>
        )}
        {isMe && <View style={{ width: 36 }} />}
      </View>

      <FlatList
        data={videos ?? []}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!(videos?.length)}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : 0 },
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
          <View style={styles.profileSection}>
            <View style={styles.heroRow}>
              <AvatarImage
                avatarUrl={member.avatarUrl}
                avatarEmoji={member.avatar}
                size={80}
              />
              <View style={styles.heroInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>
                    {member.name}
                  </Text>
                  {member.verified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.buddy} />
                  )}
                </View>
                <Text style={[styles.age, { color: colors.mutedForeground }]}>
                  Age {member.age}
                </Text>
                <View style={styles.gymRow}>
                  <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.gym, { color: colors.mutedForeground }]}>
                    {member.gym}
                  </Text>
                </View>
                {member.checkedIn && (
                  <View style={[styles.checkinPill, { backgroundColor: `${colors.advisor}22`, borderColor: `${colors.advisor}55` }]}>
                    <View style={[styles.checkinDot, { backgroundColor: colors.advisor }]} />
                    <Text style={[styles.checkinText, { color: colors.advisor }]}>
                      Here now
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {member.bio ? (
              <Text style={[styles.bio, { color: colors.mutedForeground }]}>
                {member.bio}
              </Text>
            ) : null}

            {member.interests.length > 0 && (
              <View style={styles.tags}>
                {member.interests.map((tag) => (
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

            {member.schedule && (
              <View style={[styles.scheduleRow, { borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.schedule, { color: colors.mutedForeground }]}>
                  {member.schedule}
                </Text>
              </View>
            )}

            {existingConn && (
              <View style={styles.connBadgeSection}>
                <ConnectionBadge
                  type={existingConn.type as "crush" | "buddy" | "advisor" | "spotter"}
                />
              </View>
            )}

            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Workout Videos
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="videocam-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No videos yet
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <VideoCard
            id={item.id}
            title={item.title}
            uploaderName={member.name}
            createdAt={item.createdAt}
          />
        )}
      />

      {showConnectMenu && (
        <Pressable
          style={styles.overlay}
          onPress={() => setShowConnectMenu(false)}
        >
          <View
            style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.menuTitle, { color: colors.foreground }]}>
              Connect as...
            </Text>
            {CONNECTION_TYPES.map((ct) => (
              <Pressable
                key={ct.type}
                style={({ pressed }) => [
                  styles.menuItem,
                  { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleConnect(ct.type, ct.anonymous)}
              >
                <Ionicons name={ct.icon} size={20} color={colors[ct.type] as string} />
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemLabel, { color: colors.foreground }]}>
                    {ct.label}
                  </Text>
                  {ct.anonymous && (
                    <Text style={[styles.menuItemSub, { color: colors.mutedForeground }]}>
                      Anonymous
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  connectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedBadge: {},
  list: {
    paddingHorizontal: 16,
  },
  profileSection: {
    gap: 12,
    paddingTop: 16,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  age: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  gym: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  checkinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 2,
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
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  schedule: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  connBadgeSection: {
    flexDirection: "row",
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    marginTop: 40,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  menu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 4,
  },
  menuTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  menuItemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});

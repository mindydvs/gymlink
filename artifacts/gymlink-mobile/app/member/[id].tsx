import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  useCancelConnection,
  getListConnectionsQueryKey,
  getListUsersQueryKey,
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


  const cachedUsers = queryClient.getQueryData<{ id: string; name: string; [key: string]: unknown }[]>(
    getListUsersQueryKey()
  );
  const cachedMember = cachedUsers?.find((u) => u.id === id);

  const {
    data: member,
    isLoading,
    refetch,
    isRefetching,
  } = useGetUser(id ?? "", {
    query: {
      initialData: cachedMember as never,
      initialDataUpdatedAt: 0,
    },
  });

  const { data: videos, refetch: refetchVideos } = useListWorkoutVideos({
    userId: id ?? "",
  });

  const { data: connections } = useListConnections({});
  const { mutate: createConnection, isPending: connecting } = useCreateConnection();

  const isMe = id === userId;

  // Accepted connection (either direction)
  const existingConn = connections?.find(
    (c) =>
      c.status === "accepted" &&
      ((c.fromUserId === userId && c.toUserId === id) ||
       (c.toUserId === userId && c.fromUserId === id))
  );

  // Pending request already sent FROM me TO this person
  const sentConn = connections?.find(
    (c) => c.fromUserId === userId && c.toUserId === id && c.status === "pending"
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const UNDO_SECONDS = 10;

  const [crushPanelOpen, setCrushPanelOpen] = React.useState(false);
  const [crushAnonymous, setCrushAnonymous] = React.useState(true);
  const [crushMutualNotify, setCrushMutualNotify] = React.useState(false);
  const [undoPending, setUndoPending] = React.useState<{
    type: "crush" | "buddy" | "advisor" | "spotter";
    anonymous: boolean;
    mutualNotify: boolean;
    countdown: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutate: cancelConnection, isPending: cancelling } = useCancelConnection();

  const fireSend = (type: "crush" | "buddy" | "advisor" | "spotter", anon: boolean, mutual: boolean) => {
    if (!id) return;
    createConnection(
      { data: { toUserId: id, type, anonymous: anon, mutualNotify: mutual } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() }),
        onError: () => Alert.alert("Error", "Failed to send connection request"),
      }
    );
  };

  const startUndo = (type: "crush" | "buddy" | "advisor" | "spotter", anon: boolean, mutual: boolean) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) clearInterval(timerRef.current);
    setCrushPanelOpen(false);
    setUndoPending({ type, anonymous: anon, mutualNotify: mutual, countdown: UNDO_SECONDS });

    timerRef.current = setInterval(() => {
      setUndoPending((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          fireSend(prev.type, prev.anonymous, prev.mutualNotify);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const handleUndo = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setUndoPending(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Cancelled", "Request cancelled — nothing was sent");
  };

  const handleCancelSent = () => {
    if (!sentConn) return;
    const connId = sentConn.id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistically remove from every cached connections list right away
    queryClient.setQueriesData<unknown[]>(
      { queryKey: getListConnectionsQueryKey() },
      (old) => (old ?? []).filter((c: { id: string }) => c.id !== connId)
    );

    cancelConnection(
      { id: connId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
          Alert.alert("Error", "Failed to cancel request");
        },
      }
    );
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.foreground }]} numberOfLines={1}>
            {member.name}
          </Text>
          {existingConn && (
            <ConnectionBadge
              type={existingConn.type as "crush" | "buddy" | "advisor" | "spotter"}
              small
            />
          )}
        </View>
        <View style={{ width: 32 }} />
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

            {!isMe && !existingConn && (
              <View style={styles.connectSection}>
                <Text style={[styles.connectLabel, { color: colors.mutedForeground }]}>
                  Connect as...
                </Text>
                <View style={styles.connectGrid}>
                  {CONNECTION_TYPES.map((ct) => {
                    const wasSent = (sentConn?.type === ct.type) || (undoPending?.type === ct.type);
                    const anyLocked = !!(sentConn || undoPending);
                    return (
                      <Pressable
                        key={ct.type}
                        onPress={() => {
                          if (anyLocked) return;
                          if (ct.type === "crush") {
                            setCrushPanelOpen((v) => !v);
                          } else {
                            startUndo(ct.type, false, false);
                          }
                        }}
                        disabled={connecting || anyLocked}
                        style={({ pressed }) => [
                          styles.connectTile,
                          {
                            backgroundColor: wasSent
                              ? `${colors[ct.type]}25`
                              : ct.type === "crush" && crushPanelOpen
                              ? `${colors.crush}25`
                              : `${colors[ct.type]}18`,
                            borderColor: wasSent
                              ? `${colors[ct.type]}99`
                              : ct.type === "crush" && crushPanelOpen
                              ? `${colors.crush}88`
                              : `${colors[ct.type]}55`,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <Ionicons name={ct.icon} size={22} color={colors[ct.type] as string} />
                        <Text style={[styles.connectTileLabel, { color: colors[ct.type] as string }]}>
                          {ct.label}
                        </Text>
                        {wasSent ? (
                          <View style={styles.sentRow}>
                            <Ionicons name="paper-plane-outline" size={11} color={colors[ct.type] as string} />
                            <Text style={[styles.sentLabel, { color: colors[ct.type] as string }]}>Sent</Text>
                          </View>
                        ) : ct.type === "crush" ? (
                          <Text style={[styles.connectTileAnon, { color: colors.mutedForeground }]}>
                            {crushPanelOpen ? "Tap to collapse" : "Tap to configure"}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Undo countdown banner */}
                {undoPending && (() => {
                  const undoColor = colors[undoPending.type] as string;
                  const progress = (undoPending.countdown / UNDO_SECONDS) * 100;
                  return (
                    <View style={[styles.undoBanner, { borderColor: undoColor + "55", backgroundColor: undoColor + "0C" }]}>
                      <View style={[styles.undoProgress, { width: `${progress}%` as `${number}%`, backgroundColor: undoColor }]} />
                      <View style={styles.undoContent}>
                        <Ionicons name="paper-plane-outline" size={16} color={undoColor} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.undoTitle, { color: colors.foreground }]}>
                            Sending in {undoPending.countdown}s…
                          </Text>
                          <Text style={[styles.undoSub, { color: colors.mutedForeground }]}>
                            Tap Undo to cancel before it goes
                          </Text>
                        </View>
                        <Pressable
                          onPress={handleUndo}
                          style={[styles.undoBtn, { backgroundColor: undoColor + "22" }]}
                        >
                          <Ionicons name="arrow-undo-outline" size={14} color={undoColor} />
                          <Text style={[styles.undoBtnText, { color: undoColor }]}>Undo</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })()}

                {sentConn && !undoPending && (
                  <View style={[styles.sentStatus, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                    <View style={styles.sentStatusTop}>
                      <View style={[styles.sentStatusIcon, { backgroundColor: colors.muted }]}>
                        <Ionicons name="paper-plane-outline" size={15} color={colors.mutedForeground} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sentStatusTitle, { color: colors.foreground }]}>Request sent</Text>
                        <Text style={[styles.sentStatusSub, { color: colors.mutedForeground }]}>
                          Waiting for their response. They may have already seen this.
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={handleCancelSent}
                      disabled={cancelling}
                      style={({ pressed }) => [
                        styles.cancelBtn,
                        { backgroundColor: colors.muted, opacity: pressed || cancelling ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="close-circle-outline" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                        {cancelling ? "Cancelling…" : "Take Back Request"}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Crush options panel — only shown when no pending request */}
                {crushPanelOpen && !sentConn && !undoPending && (
                  <View style={[styles.crushPanel, { borderColor: `${colors.crush}44`, backgroundColor: `${colors.crush}08` }]}>
                    {/* Anonymous toggle */}
                    <Pressable
                      onPress={() => setCrushAnonymous((v) => !v)}
                      style={[
                        styles.crushOption,
                        {
                          borderColor: crushAnonymous ? `${colors.crush}55` : colors.border,
                          backgroundColor: crushAnonymous ? `${colors.crush}12` : "transparent",
                        },
                      ]}
                    >
                      <View style={[styles.crushOptionIcon, { backgroundColor: crushAnonymous ? `${colors.crush}22` : colors.muted }]}>
                        <Ionicons
                          name={crushAnonymous ? "eye-off-outline" : "eye-outline"}
                          size={18}
                          color={crushAnonymous ? colors.crush : colors.mutedForeground}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.crushOptionTitle, { color: colors.foreground }]}>
                          {crushAnonymous ? "Stay anonymous" : "Show your name"}
                        </Text>
                        <Text style={[styles.crushOptionSub, { color: colors.mutedForeground }]}>
                          {crushAnonymous ? "They won't know it's you" : "They'll see your name"}
                        </Text>
                      </View>
                      <View style={[
                        styles.crushOptionDot,
                        crushAnonymous
                          ? { borderColor: colors.crush, backgroundColor: colors.crush }
                          : { borderColor: colors.border },
                      ]}>
                        {crushAnonymous && <View style={styles.crushOptionDotInner} />}
                      </View>
                    </Pressable>

                    {/* Mutual notify toggle */}
                    <Pressable
                      onPress={() => setCrushMutualNotify((v) => !v)}
                      style={[
                        styles.crushOption,
                        {
                          borderColor: crushMutualNotify ? `${colors.crush}55` : colors.border,
                          backgroundColor: crushMutualNotify ? `${colors.crush}12` : "transparent",
                        },
                      ]}
                    >
                      <View style={[styles.crushOptionIcon, { backgroundColor: crushMutualNotify ? `${colors.crush}22` : colors.muted }]}>
                        <Ionicons
                          name="sparkles-outline"
                          size={18}
                          color={crushMutualNotify ? colors.crush : colors.mutedForeground}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.crushOptionTitle, { color: colors.foreground }]}>
                          Notify me if they crush back
                        </Text>
                        <Text style={[styles.crushOptionSub, { color: colors.mutedForeground }]}>
                          {crushMutualNotify
                            ? "You'll both know if it's mutual"
                            : "No mutual alerts"}
                        </Text>
                      </View>
                      <View style={[
                        styles.crushOptionDot,
                        crushMutualNotify
                          ? { borderColor: colors.crush, backgroundColor: colors.crush }
                          : { borderColor: colors.border },
                      ]}>
                        {crushMutualNotify && <View style={styles.crushOptionDotInner} />}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => startUndo("crush", crushAnonymous, crushMutualNotify)}
                      disabled={connecting}
                      style={({ pressed }) => [
                        styles.crushSendBtn,
                        { backgroundColor: colors.crush, opacity: pressed || connecting ? 0.8 : 1 },
                      ]}
                    >
                      {connecting
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.crushSendBtnText}>Send Gym Crush 💘</Text>
                      }
                    </Pressable>
                  </View>
                )}

                {connecting && !crushPanelOpen && (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />
                )}
              </View>
            )}

            {existingConn && (
              <View style={[styles.connectedRow, { borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.advisor} />
                <Text style={[styles.connectedText, { color: colors.mutedForeground }]}>
                  Connected as
                </Text>
                <ConnectionBadge
                  type={existingConn.type as "crush" | "buddy" | "advisor" | "spotter"}
                  small
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
            likeCount={item.likeCount}
            likedByMe={item.likedByMe}
          />
        )}
      />

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
  topBarCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    flexShrink: 1,
  },
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
  connectSection: {
    gap: 10,
  },
  connectLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  connectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  connectTile: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
    alignItems: "flex-start",
  },
  connectTileLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  connectTileAnon: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  sentLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  sentStatus: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  sentStatusTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sentStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sentStatusTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  sentStatusSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  sentStatusText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  crushPanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  crushOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  crushOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  crushOptionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  crushOptionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  crushOptionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  crushOptionDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  crushSendBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 2,
  },
  crushSendBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  connectedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
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
  undoBanner: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  undoProgress: {
    height: 3,
  },
  undoContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  undoTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  undoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});

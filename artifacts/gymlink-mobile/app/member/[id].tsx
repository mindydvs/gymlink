import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
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
import { ReportSheet } from "@/components/ReportSheet";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useGetUser,
  useListWorkoutVideos,
  useListConnections,
  useCreateConnection,
  useCancelConnection,
  useListRecipes,
  useBlockUser,
  useReportUser,
  getListConnectionsQueryKey,
  getListUsersQueryKey,
  getListBlocksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function mediaUrl(objectPath: string) {
  return `${API_BASE}/api/storage${objectPath}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type RecipeItem = {
  id: string;
  title: string;
  description?: string | null;
  ingredients: string[];
  steps: string[];
  mediaObjectPath?: string | null;
  mediaType?: string | null;
  createdAt: string;
};

type ColorsType = ReturnType<typeof useColors>;

function RecipeCard({ recipe, colors }: { recipe: RecipeItem; colors: ColorsType }) {
  const [expanded, setExpanded] = useState(false);
  const hasImage = recipe.mediaObjectPath && recipe.mediaType !== "video";
  const hasVideo = recipe.mediaObjectPath && recipe.mediaType === "video";

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => [
        recipeStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri: mediaUrl(recipe.mediaObjectPath!) }}
          style={recipeStyles.thumbnail}
          resizeMode="cover"
        />
      ) : hasVideo ? (
        <View style={[recipeStyles.videoThumb, { backgroundColor: colors.muted }]}>
          <Ionicons name="play-circle-outline" size={32} color={colors.mutedForeground} />
        </View>
      ) : null}

      <View style={recipeStyles.cardBody}>
        <View style={recipeStyles.cardRow}>
          <Ionicons name="restaurant-outline" size={15} color={colors.primary} style={{ marginTop: 1 }} />
          <Text style={[recipeStyles.title, { color: colors.foreground }]} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>
        {recipe.description ? (
          <Text style={[recipeStyles.desc, { color: colors.mutedForeground }]} numberOfLines={expanded ? undefined : 2}>
            {recipe.description}
          </Text>
        ) : null}

        <View style={recipeStyles.metaRow}>
          {recipe.ingredients.length > 0 && (
            <View style={[recipeStyles.metaPill, { backgroundColor: `${colors.advisor}18` }]}>
              <Ionicons name="list-outline" size={11} color={colors.advisor} />
              <Text style={[recipeStyles.metaText, { color: colors.advisor }]}>
                {recipe.ingredients.length} ingredients
              </Text>
            </View>
          )}
          {recipe.steps.length > 0 && (
            <View style={[recipeStyles.metaPill, { backgroundColor: `${colors.buddy}18` }]}>
              <Ionicons name="footsteps-outline" size={11} color={colors.buddy} />
              <Text style={[recipeStyles.metaText, { color: colors.buddy }]}>
                {recipe.steps.length} steps
              </Text>
            </View>
          )}
          <Text style={[recipeStyles.time, { color: colors.mutedForeground }]}>
            {timeAgo(recipe.createdAt)}
          </Text>
        </View>

        {expanded && (
          <View style={recipeStyles.expandedSection}>
            {recipe.ingredients.length > 0 && (
              <View style={recipeStyles.expandBlock}>
                <Text style={[recipeStyles.expandLabel, { color: colors.foreground }]}>Ingredients</Text>
                {recipe.ingredients.map((ing, i) => (
                  <View key={i} style={recipeStyles.expandItem}>
                    <View style={[recipeStyles.bullet, { backgroundColor: colors.primary }]} />
                    <Text style={[recipeStyles.expandText, { color: colors.mutedForeground }]}>{ing}</Text>
                  </View>
                ))}
              </View>
            )}
            {recipe.steps.length > 0 && (
              <View style={recipeStyles.expandBlock}>
                <Text style={[recipeStyles.expandLabel, { color: colors.foreground }]}>Steps</Text>
                {recipe.steps.map((step, i) => (
                  <View key={i} style={recipeStyles.expandItem}>
                    <Text style={[recipeStyles.stepNum, { color: colors.primary }]}>{i + 1}.</Text>
                    <Text style={[recipeStyles.expandText, { color: colors.mutedForeground }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={recipeStyles.expandHint}>
          <Ionicons
            name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={[recipeStyles.expandHintText, { color: colors.mutedForeground }]}>
            {expanded ? "Collapse" : "See ingredients & steps"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const recipeStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 160,
  },
  videoThumb: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    flex: 1,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginLeft: "auto",
  },
  expandedSection: {
    gap: 10,
    marginTop: 4,
  },
  expandBlock: {
    gap: 4,
  },
  expandLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 2,
  },
  expandItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    minWidth: 18,
  },
  expandText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  expandHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    justifyContent: "center",
  },
  expandHintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});

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

  const { data: memberRecipes, refetch: refetchRecipes } = useListRecipes({ userId: id ?? "" });

  const { data: connections } = useListConnections({});
  const { mutate: createConnection, isPending: connecting } = useCreateConnection();

  const isMe = id === userId;

  // All accepted connections with this person (either direction), one per type
  const acceptedConns = connections?.filter(
    (c) =>
      c.status === "accepted" &&
      ((c.fromUserId === userId && c.toUserId === id) ||
       (c.toUserId === userId && c.fromUserId === id))
  ) ?? [];

  // All pending requests sent FROM me TO this person
  const sentConns = connections?.filter(
    (c) => c.fromUserId === userId && c.toUserId === id && c.status === "pending"
  ) ?? [];

  const sentConnOfType = (type: string) => sentConns.find((c) => c.type === type);
  const acceptedConnOfType = (type: string) => acceptedConns.find((c) => c.type === type);

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
  const { mutate: blockUser, isPending: blocking } = useBlockUser();
  const { mutate: reportUser, isPending: reporting } = useReportUser();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);

  const handleBlock = () => {
    if (!id || !member) return;
    setShowMoreMenu(false);
    Alert.alert(
      `Block ${member.name}?`,
      "They won't be able to see your profile, videos, or send you connection requests. You won't see them either. You can unblock them later from your profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            blockUser(
              { id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getListBlocksQueryKey() });
                  router.back();
                },
                onError: () => Alert.alert("Error", "Could not block this user. Please try again."),
              },
            );
          },
        },
      ],
    );
  };

  const handleReport = (reason: string, details?: string) => {
    if (!id) return;
    reportUser(
      { id, data: { reason, details } },
      {
        onSuccess: () => {
          setShowReportSheet(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            "Report submitted",
            "Thanks for letting us know. Our team will review this within 24 hours.",
          );
        },
        onError: () => Alert.alert("Error", "Could not submit your report. Please try again."),
      },
    );
  };

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

  const handleCancelSent = (connId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
          {acceptedConns.map((c) => (
            <ConnectionBadge
              key={c.id}
              type={c.type as "crush" | "buddy" | "advisor" | "spotter"}
              small
            />
          ))}
        </View>
        {isMe ? (
          <View style={{ width: 32 }} />
        ) : (
          <Pressable
            onPress={() => setShowMoreMenu(true)}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.foreground} />
          </Pressable>
        )}
      </View>

      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <Pressable
          style={moreMenuStyles.overlay}
          onPress={() => setShowMoreMenu(false)}
        >
          <Pressable
            style={[
              moreMenuStyles.sheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <View style={[moreMenuStyles.handle, { backgroundColor: colors.border }]} />
            <Pressable
              style={({ pressed }) => [
                moreMenuStyles.item,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                setShowMoreMenu(false);
                setShowReportSheet(true);
              }}
            >
              <View style={[moreMenuStyles.iconWrap, { backgroundColor: `${colors.spotter}22` }]}>
                <Ionicons name="flag-outline" size={20} color={colors.spotter} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[moreMenuStyles.label, { color: colors.foreground }]}>
                  Report
                </Text>
                <Text style={[moreMenuStyles.sub, { color: colors.mutedForeground }]}>
                  Tell us about inappropriate content or behavior
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                moreMenuStyles.item,
                { borderBottomColor: "transparent", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleBlock}
              disabled={blocking}
            >
              <View style={[moreMenuStyles.iconWrap, { backgroundColor: "rgba(232,25,60,0.15)" }]}>
                <Ionicons name="ban-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[moreMenuStyles.label, { color: colors.primary }]}>
                  Block {member.name}
                </Text>
                <Text style={[moreMenuStyles.sub, { color: colors.mutedForeground }]}>
                  Stop seeing them and prevent contact
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ReportSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        onSubmit={handleReport}
        isSubmitting={reporting}
        targetLabel={member.name}
      />

      <FlatList
        data={videos ?? []}
        keyExtractor={(item) => item.id}
        scrollEnabled
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
              refetchRecipes();
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

            {!isMe && (
              <View style={styles.connectSection}>
                <Text style={[styles.connectLabel, { color: colors.mutedForeground }]}>
                  Connect as...
                </Text>
                <View style={styles.connectGrid}>
                  {CONNECTION_TYPES.map((ct) => {
                    const sent = sentConnOfType(ct.type);
                    const accepted = acceptedConnOfType(ct.type);
                    const wasSent = !!sent || undoPending?.type === ct.type;
                    const thisLocked = wasSent || !!accepted;
                    return (
                      <Pressable
                        key={ct.type}
                        onPress={() => {
                          if (thisLocked) return;
                          if (ct.type === "crush") {
                            setCrushPanelOpen((v) => !v);
                          } else {
                            startUndo(ct.type, false, false);
                          }
                        }}
                        disabled={connecting && !crushPanelOpen}
                        style={({ pressed }) => [
                          styles.connectTile,
                          {
                            backgroundColor: accepted
                              ? `${colors[ct.type]}15`
                              : wasSent
                              ? `${colors[ct.type]}25`
                              : ct.type === "crush" && crushPanelOpen
                              ? `${colors.crush}25`
                              : `${colors[ct.type]}18`,
                            borderColor: accepted
                              ? `${colors[ct.type]}99`
                              : wasSent
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
                        {accepted ? (
                          <View style={styles.sentRow}>
                            <Ionicons name="checkmark-circle-outline" size={11} color={colors[ct.type] as string} />
                            <Text style={[styles.sentLabel, { color: colors[ct.type] as string }]}>Connected</Text>
                          </View>
                        ) : wasSent ? (
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

                {/* Per-type sent statuses */}
                {sentConns.filter((sc) => undoPending?.type !== sc.type).map((sc) => (
                  <View key={sc.id} style={[styles.sentStatus, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                    <View style={styles.sentStatusTop}>
                      <View style={[styles.sentStatusIcon, { backgroundColor: colors.muted }]}>
                        <Ionicons name="paper-plane-outline" size={15} color={colors.mutedForeground} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sentStatusTitle, { color: colors.foreground }]}>
                          {CONNECTION_TYPES.find((c) => c.type === sc.type)?.label ?? sc.type} request sent
                        </Text>
                        <Text style={[styles.sentStatusSub, { color: colors.mutedForeground }]}>
                          Waiting for their response. They may have already seen this.
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleCancelSent(sc.id)}
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
                ))}

                {/* Crush options panel — only shown when crush not yet sent */}
                {crushPanelOpen && !sentConnOfType("crush") && undoPending?.type !== "crush" && (
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

            {acceptedConns.map((conn) => (
              <View key={conn.id} style={[styles.connectedRow, { borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.advisor} />
                <Text style={[styles.connectedText, { color: colors.mutedForeground }]}>
                  Connected as
                </Text>
                <ConnectionBadge
                  type={conn.type as "crush" | "buddy" | "advisor" | "spotter"}
                  small
                />
              </View>
            ))}

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
        ListFooterComponent={
          <View style={styles.recipesSection}>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View style={styles.recipesSectionHeader}>
              <Ionicons name="restaurant-outline" size={18} color={colors.foreground} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Recipes
              </Text>
            </View>
            {!memberRecipes || memberRecipes.length === 0 ? (
              <View style={styles.recipesEmpty}>
                <Ionicons name="restaurant-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No recipes yet
                </Text>
              </View>
            ) : (
              (memberRecipes as Array<{
                id: string;
                title: string;
                description?: string | null;
                ingredients: string[];
                steps: string[];
                mediaObjectPath?: string | null;
                mediaType?: string | null;
                createdAt: string;
              }>).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} colors={colors} />
              ))
            )}
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
            canReport={!isMe}
          />
        )}
      />

    </View>
  );
}

const moreMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
});

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
  recipesSection: {
    marginTop: 4,
    paddingBottom: 32,
  },
  recipesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recipesEmpty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
});

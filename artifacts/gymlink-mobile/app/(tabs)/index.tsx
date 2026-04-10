import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
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
import { MemberCard } from "@/components/MemberCard";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useGetGymStats,
  useGetMe,
  useListConnections,
  useListUsers,
} from "@workspace/api-client-react";
import { router } from "expo-router";

type PanelKey = "activeNow" | "members" | "crush" | "buddy";

const PANEL_META: Record<PanelKey, { title: string; color: string }> = {
  activeNow: { title: "Active Now",     color: "#12B76A" },
  members:   { title: "All Members",    color: "#00C4E8" },
  crush:     { title: "Gym Crushes",    color: "#E8193C" },
  buddy:     { title: "Workout Buddies",color: "#0B9ED9" },
};

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

  const { data: me } = useGetMe();
  const { data: stats, refetch: refetchStats } = useGetGymStats();
  const {
    data: members,
    isLoading,
    refetch: refetchMembers,
    isRefetching,
  } = useListUsers({ gym: me?.gymId ?? undefined });
  const { data: connections } = useListConnections();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const otherMembers = members?.filter((m) => m.id !== userId) ?? [];

  const panelMembers = (() => {
    if (!activePanel) return [];
    if (activePanel === "activeNow") return otherMembers.filter((m) => m.activeNow);
    if (activePanel === "members") return otherMembers;
    const type = activePanel;
    const connectedIds = new Set(
      (connections ?? [])
        .filter((c) => c.type === type && c.status === "accepted")
        .map((c) => (c.requesterId === userId ? c.receiverId : c.requesterId))
    );
    return otherMembers.filter((m) => connectedIds.has(m.id));
  })();

  const statItems: { label: string; value: number; color: string; key: PanelKey }[] = stats
    ? [
        { label: "Active Now", value: stats.activeNow,    color: colors.advisor,   key: "activeNow" },
        { label: "Members",    value: stats.totalMembers, color: colors.brandCyan, key: "members"   },
        { label: "Crushes",    value: stats.crushCount,   color: colors.crush,     key: "crush"     },
        { label: "Buddies",    value: stats.buddyCount,   color: colors.buddy,     key: "buddy"     },
      ]
    : [];

  const meta = activePanel ? PANEL_META[activePanel] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Stat panel bottom sheet ── */}
      <Modal
        visible={!!activePanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActivePanel(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: meta?.color ?? colors.primary }} />
              <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                {meta?.title}
              </Text>
              <View style={{ backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  {panelMembers.length}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setActivePanel(null)}
              hitSlop={12}
              style={{ backgroundColor: colors.card, borderRadius: 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Member list */}
          {panelMembers.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Ionicons name="people-outline" size={44} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                Nobody here yet
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {panelMembers.map((item) => (
                <MemberCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  age={item.age}
                  avatar={item.avatar}
                  avatarUrl={item.avatarUrl}
                  bio={item.bio}
                  interests={item.interests}
                  activeNow={item.activeNow}
                  checkedIn={item.checkedIn}
                  verified={item.verified}
                  onPress={() => {
                    setActivePanel(null);
                    router.push(`/member/${item.id}`);
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      <FlatList
        data={otherMembers}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!otherMembers.length}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPad + 134, paddingBottom: Platform.OS === "web" ? 34 : 0 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchStats();
              refetchMembers();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {stats && (
              <>
                <Text style={[styles.gymName, { color: colors.foreground }]}>
                  {stats.gymName}
                </Text>
                <View style={styles.statsRow}>
                  {statItems.map((s) => (
                    <Pressable
                      key={s.label}
                      onPress={() => setActivePanel(s.key)}
                      style={({ pressed }) => [
                        styles.statBox,
                        {
                          backgroundColor: colors.card,
                          borderColor: activePanel === s.key ? s.color : colors.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                        activePanel === s.key && { shadowColor: s.color, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
                      ]}
                    >
                      <Text style={[styles.statValue, { color: s.color }]}>
                        {s.value}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              At Your Gym
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No members found
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <MemberCard
            key={item.id}
            id={item.id}
            name={item.name}
            age={item.age}
            avatar={item.avatar}
            avatarUrl={item.avatarUrl}
            bio={item.bio}
            interests={item.interests}
            activeNow={item.activeNow}
            checkedIn={item.checkedIn}
            verified={item.verified}
            onPress={() => router.push(`/member/${item.id}`)}
          />
        )}
      />

      <View
        style={[
          styles.header,
          {
            top: topPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Pressable
          onPress={() => router.push(`/member/${me?.id ?? userId}`)}
          style={styles.avatarBtn}
        >
          <AvatarImage
            avatarUrl={me?.avatarUrl}
            avatarEmoji={me?.avatar}
            size={32}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logo: {
    height: 108,
    width: 220,
  },
  avatarBtn: {},
  list: {
    paddingHorizontal: 16,
  },
  headerSection: {
    gap: 12,
    marginBottom: 8,
  },
  gymName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 4,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    marginTop: 60,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

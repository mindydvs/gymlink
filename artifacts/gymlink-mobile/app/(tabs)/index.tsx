import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
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
  useListUsers,
} from "@workspace/api-client-react";
import { router } from "expo-router";

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const { data: me } = useGetMe();
  const { data: stats, refetch: refetchStats } = useGetGymStats();
  const {
    data: members,
    isLoading,
    refetch: refetchMembers,
    isRefetching,
  } = useListUsers({ gym: me?.gymId ?? undefined });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const statItems = stats
    ? [
        { label: "Active Now", value: stats.activeNow, color: colors.advisor },
        { label: "Members", value: stats.totalMembers, color: colors.brandCyan },
        { label: "Crushes", value: stats.crushCount, color: colors.crush },
        { label: "Buddies", value: stats.buddyCount, color: colors.buddy },
      ]
    : [];

  const otherMembers = members?.filter((m) => m.id !== userId) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                    <View
                      key={s.label}
                      style={[
                        styles.statBox,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.statValue, { color: s.color }]}>
                        {s.value}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                        {s.label}
                      </Text>
                    </View>
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

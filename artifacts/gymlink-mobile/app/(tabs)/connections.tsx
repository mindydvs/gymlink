import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationCard } from "@/components/NotificationCard";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { AvatarImage } from "@/components/AvatarImage";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useListNotifications,
  useListConnections,
} from "@workspace/api-client-react";
import { router } from "expo-router";

type Tab = "requests" | "connections";

export default function ConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const {
    data: notifications,
    isLoading: notifsLoading,
    refetch: refetchNotifs,
    isRefetching: notifsRefetching,
  } = useListNotifications();

  const {
    data: connections,
    isLoading: connsLoading,
    refetch: refetchConns,
    isRefetching: connsRefetching,
  } = useListConnections({ status: "accepted" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const unreadCount = notifications?.filter((n) => !n.read && !n.responded).length ?? 0;

  const myConnections = connections?.filter(
    (c) => c.fromUserId === userId || c.toUserId === userId
  ) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Connections</Text>

        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "requests" && {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "requests" ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Requests
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === "connections" && {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setActiveTab("connections")}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "connections" ? colors.foreground : colors.mutedForeground },
              ]}
            >
              My Connections
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "requests" ? (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!(notifications?.length)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : 0 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={notifsRefetching}
              onRefresh={refetchNotifs}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            notifsLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="notifications-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No connection requests yet
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <NotificationCard
              id={item.id}
              connectionId={item.connectionId}
              type={item.type as "crush" | "buddy" | "advisor" | "spotter"}
              fromName={item.fromName}
              anonymous={item.anonymous}
              read={item.read}
              responded={item.responded}
              createdAt={item.createdAt}
            />
          )}
        />
      ) : (
        <FlatList
          data={myConnections}
          keyExtractor={(item) => item.id}
          scrollEnabled={!!myConnections.length}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : 0 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={connsRefetching}
              onRefresh={refetchConns}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            connsLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No connections yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                  Browse members to send a connection request
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const other = item.fromUserId === userId ? item.toUser : item.fromUser;
            if (!other) return null;
            return (
              <Pressable
                onPress={() => router.push(`/member/${other.id}`)}
                style={({ pressed }) => [
                  styles.connCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <AvatarImage
                  avatarUrl={other.avatarUrl}
                  avatarEmoji={other.avatar}
                  size={44}
                />
                <View style={styles.connInfo}>
                  <Text style={[styles.connName, { color: colors.foreground }]}>
                    {other.name}
                  </Text>
                  <ConnectionBadge
                    type={item.type as "crush" | "buddy" | "advisor" | "spotter"}
                    small
                  />
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.border} />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  badge: {
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    marginTop: 60,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  emptySubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  connCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  connInfo: {
    flex: 1,
    gap: 4,
  },
  connName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
});

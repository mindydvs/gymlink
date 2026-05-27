import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarImage } from "@/components/AvatarImage";
import { useColors } from "@/hooks/useColors";
import {
  useListBlocks,
  useUnblockUser,
  getListBlocksQueryKey,
  getListUsersQueryKey,
  getListConnectionsQueryKey,
} from "@workspace/api-client-react";

export default function BlockedUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListBlocks();
  const { mutate: unblock, isPending: unblocking } = useUnblockUser();

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  const confirmUnblock = (blockedId: string, name: string) => {
    Alert.alert(
      `Unblock ${name}?`,
      "They'll be able to see your profile and contact you again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () => {
            unblock(
              { id: blockedId },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getListBlocksQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
                },
                onError: () => Alert.alert("Error", "Could not unblock. Please try again."),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.topBar,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Blocked Users</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.blockedId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No blocked users
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Anyone you block will appear here. You can unblock them anytime.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <AvatarImage avatarUrl={item.avatarUrl} avatarEmoji={item.avatar} size={44} />
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable
                style={[styles.unblockBtn, { borderColor: colors.primary }]}
                onPress={() => confirmUnblock(item.blockedId, item.name)}
                disabled={unblocking}
              >
                <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unblockText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  empty: { alignItems: "center", gap: 10, marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
});

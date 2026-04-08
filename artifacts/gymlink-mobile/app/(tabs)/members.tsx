import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MemberCard } from "@/components/MemberCard";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { useListUsers } from "@workspace/api-client-react";
import { router } from "expo-router";

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const [search, setSearch] = useState("");

  const { data: members, isLoading, refetch, isRefetching } = useListUsers({
    search: search.length > 1 ? search : undefined,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const otherMembers = members?.filter((m) => m.id !== userId) ?? [];

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
        <Text style={[styles.title, { color: colors.foreground }]}>Members</Text>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or interest..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.mutedForeground}
              onPress={() => setSearch("")}
            />
          )}
        </View>
      </View>

      <FlatList
        data={otherMembers}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!otherMembers.length}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : 0 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? "No members match your search" : "No members found"}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <MemberCard
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 0,
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
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

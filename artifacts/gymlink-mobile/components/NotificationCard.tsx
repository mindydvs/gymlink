import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { useColors } from "@/hooks/useColors";
import {
  useRespondToConnection,
  getListNotificationsQueryKey,
  getListConnectionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationCardProps {
  id: string;
  connectionId: string;
  type: "crush" | "buddy" | "advisor" | "spotter";
  fromName: string;
  anonymous: boolean;
  read: boolean;
  responded: boolean;
  createdAt: string;
}

export function NotificationCard({
  connectionId,
  type,
  fromName,
  anonymous,
  read,
  responded,
  createdAt,
}: NotificationCardProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { mutate: respond, isPending } = useRespondToConnection();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleRespond = (response: "accept" | "decline") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    respond(
      { id: connectionId, data: { response } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
        },
      }
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: read ? colors.border : `${colors[type]}44`,
        },
      ]}
    >
      {!read && (
        <View style={[styles.unreadDot, { backgroundColor: colors[type] as string }]} />
      )}

      <View style={styles.header}>
        <View style={styles.from}>
          <Ionicons
            name={anonymous ? "eye-off-outline" : "person-circle-outline"}
            size={20}
            color={colors[type] as string}
          />
          <Text style={[styles.name, { color: colors.foreground }]}>
            {anonymous ? "Anonymous" : fromName}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {timeAgo(createdAt)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {anonymous ? "Someone" : fromName} wants to connect as
        </Text>
        <ConnectionBadge type={type} small />
      </View>

      {!responded && (
        <View style={styles.actions}>
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Pressable
                onPress={() => handleRespond("accept")}
                style={({ pressed }) => [
                  styles.btn,
                  styles.acceptBtn,
                  { backgroundColor: colors.advisor, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.btnText}>Accept</Text>
              </Pressable>
              <Pressable
                onPress={() => handleRespond("decline")}
                style={({ pressed }) => [
                  styles.btn,
                  styles.declineBtn,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
                <Text style={[styles.btnText, { color: colors.mutedForeground }]}>
                  Decline
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {responded && (
        <Text style={[styles.respondedText, { color: colors.mutedForeground }]}>
          Responded
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  from: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {},
  declineBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  respondedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    fontStyle: "italic",
  },
});

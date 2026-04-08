import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  useToggleVideoLike,
  useDeleteWorkoutVideo,
  useUpdateWorkoutVideo,
  getListWorkoutVideosQueryKey,
} from "@workspace/api-client-react";

interface VideoCardProps {
  id: string;
  title: string;
  uploaderName: string;
  uploaderAvatar?: React.ReactNode;
  createdAt: string;
  likeCount?: number;
  likedByMe?: boolean;
  isOwner?: boolean;
  onPress?: () => void;
  onDeleted?: (id: string) => void;
}

export function VideoCard({
  id,
  title: initialTitle,
  uploaderName,
  uploaderAvatar,
  createdAt,
  likeCount: initialLikeCount = 0,
  likedByMe: initialLikedByMe = false,
  isOwner = false,
  onPress,
  onDeleted,
}: VideoCardProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);

  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState(initialTitle);

  const { mutate: toggleLike, isPending: liking } = useToggleVideoLike();
  const { mutate: deleteVideo, isPending: deleting } = useDeleteWorkoutVideo();
  const { mutate: updateVideo, isPending: updating } = useUpdateWorkoutVideo();

  const liked = optimisticLiked ?? initialLikedByMe;
  const count = optimisticCount ?? initialLikeCount;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleLike = () => {
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setOptimisticLiked(newLiked);
    setOptimisticCount(newCount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(
      { id },
      {
        onError: () => {
          setOptimisticLiked(!newLiked);
          setOptimisticCount(count);
        },
        onSuccess: (data) => {
          setOptimisticLiked(data.likedByMe);
          setOptimisticCount(data.likeCount);
        },
      }
    );
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video? This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteVideo(
              { id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getListWorkoutVideosQueryKey() });
                  onDeleted?.(id);
                },
                onError: () => {
                  Alert.alert("Error", "Could not delete the video. Please try again.");
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleRenameOpen = () => {
    setRenameText(currentTitle);
    setShowMenu(false);
    setShowRenameModal(true);
  };

  const handleRenameSave = () => {
    const trimmed = renameText.trim();
    if (!trimmed) return;
    updateVideo(
      { id, data: { title: trimmed } },
      {
        onSuccess: (updated) => {
          setCurrentTitle(updated.title);
          queryClient.invalidateQueries({ queryKey: getListWorkoutVideosQueryKey() });
          setShowRenameModal(false);
        },
        onError: () => {
          Alert.alert("Error", "Could not update the title. Please try again.");
        },
      }
    );
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed && !showMenu ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          {deleting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="videocam" size={28} color={colors.primary} />
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {currentTitle}
          </Text>
          <View style={styles.meta}>
            {uploaderAvatar}
            <Text style={[styles.uploader, { color: colors.mutedForeground }]}>
              {uploaderName} · {timeAgo(createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {isOwner && (
            <Pressable
              onPress={() => setShowMenu(true)}
              style={styles.menuBtn}
              hitSlop={12}
              disabled={deleting}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}

          <Pressable
            onPress={handleLike}
            style={styles.likeBtn}
            hitSlop={12}
            disabled={liking}
          >
            {liking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? colors.primary : colors.mutedForeground}
                />
                {count > 0 && (
                  <Text
                    style={[
                      styles.likeCount,
                      { color: liked ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {count}
                  </Text>
                )}
              </>
            )}
          </Pressable>
        </View>
      </Pressable>

      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <Pressable
            style={[
              styles.menuSheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleRenameOpen}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: `${colors.buddy}18` }]}>
                <Ionicons name="pencil-outline" size={22} color={colors.buddy} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                Rename
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: "transparent", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleDelete}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(232,25,60,0.12)" }]}>
                <Ionicons name="trash-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.primary }]}>
                Delete
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.renameOverlay}>
          <View style={[styles.renameDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.renameTitle, { color: colors.foreground }]}>
              Rename Video
            </Text>
            <TextInput
              style={[
                styles.renameInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Enter a title..."
              placeholderTextColor={colors.mutedForeground}
              maxLength={120}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameSave}
            />
            <View style={styles.renameActions}>
              <Pressable
                onPress={() => setShowRenameModal(false)}
                style={[styles.renameCancelBtn, { borderColor: colors.border }]}
                disabled={updating}
              >
                <Text style={[styles.renameCancelText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRenameSave}
                style={[
                  styles.renameSaveBtn,
                  { backgroundColor: colors.primary, opacity: !renameText.trim() || updating ? 0.5 : 1 },
                ]}
                disabled={!renameText.trim() || updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.renameSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(232,25,60,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploader: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  likeBtn: {
    alignItems: "center",
    gap: 2,
    minWidth: 32,
  },
  likeCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  renameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  renameDialog: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  renameTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  renameActions: {
    flexDirection: "row",
    gap: 10,
  },
  renameCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  renameCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  renameSaveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  renameSaveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});

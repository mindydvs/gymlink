import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { VideoCard } from "@/components/VideoCard";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useGetMe,
  useListWorkoutVideos,
  useListConnections,
} from "@workspace/api-client-react";
import { setPendingVideo } from "@/store/videoStore";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [picking, setPicking] = useState(false);

  const { data: me, isLoading, refetch, isRefetching } = useGetMe();
  const { data: videos, refetch: refetchVideos } = useListWorkoutVideos({ userId });
  const { data: connections } = useListConnections({ status: "accepted" });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const connectionCount = connections?.length ?? 0;

  const pickVideo = async (source: "library" | "camera") => {
    setPicking(true);
    setShowAddSheet(false);

    try {
      let result;

      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Camera access is required to record a video.");
          setPicking(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "videos",
          videoMaxDuration: 180,
          quality: 0.8,
          allowsEditing: false,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Photo library access is required to pick a video.");
          setPicking(false);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "videos",
          quality: 1,
          allowsEditing: false,
        });
      }

      if (result.canceled || !result.assets?.[0]) {
        setPicking(false);
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType ?? "video/mp4";
      const fileSize = asset.fileSize ?? 0;
      const duration = asset.duration ?? undefined;
      const uriParts = uri.split("/");
      const fileName = uriParts[uriParts.length - 1] ?? `video-${Date.now()}.mp4`;

      setPendingVideo({ uri, mimeType, fileSize, duration, fileName });
      router.push("/upload-video");
    } catch {
      Alert.alert("Error", "Could not open video picker.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={videos ?? []}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!(videos?.length)}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPad + 56, paddingBottom: Platform.OS === "web" ? 34 : 0 },
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
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
          ) : me ? (
            <View style={styles.profileHeader}>
              <View style={styles.heroRow}>
                <AvatarImage
                  avatarUrl={me.avatarUrl}
                  avatarEmoji={me.avatar}
                  size={80}
                />
                <View style={styles.heroStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>
                      {videos?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                      Videos
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>
                      {connectionCount}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                      Connections
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>
                    {me.name}
                  </Text>
                  {me.verified && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.buddy} />
                  )}
                  <Text style={[styles.age, { color: colors.mutedForeground }]}>
                    {me.age}
                  </Text>
                </View>

                <View style={styles.gymRow}>
                  <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.gym, { color: colors.mutedForeground }]}>
                    {me.gym}
                  </Text>
                  {me.checkedIn && (
                    <View style={[styles.checkinPill, { backgroundColor: `${colors.advisor}22`, borderColor: `${colors.advisor}55` }]}>
                      <View style={[styles.checkinDot, { backgroundColor: colors.advisor }]} />
                      <Text style={[styles.checkinText, { color: colors.advisor }]}>
                        Here now
                      </Text>
                    </View>
                  )}
                </View>

                {me.bio ? (
                  <Text style={[styles.bio, { color: colors.mutedForeground }]}>
                    {me.bio}
                  </Text>
                ) : null}

                {me.interests.length > 0 && (
                  <View style={styles.tags}>
                    {me.interests.map((tag) => (
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
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.videosSectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  My Videos
                </Text>
                <Pressable
                  onPress={() => setShowAddSheet(true)}
                  style={[styles.addVideoBtn, { backgroundColor: colors.primary }]}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <Pressable
              style={[styles.emptyAddCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowAddSheet(true)}
            >
              <View style={[styles.emptyAddCircle, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }]}>
                <Ionicons name="videocam-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Share your first workout
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Tap to upload a video and inspire your gym community
              </Text>
              <View style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Video</Text>
              </View>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <VideoCard
            id={item.id}
            title={item.title}
            uploaderName={me?.name ?? "You"}
            createdAt={item.createdAt}
            likeCount={item.likeCount}
            likedByMe={item.likedByMe}
            isOwner
          />
        )}
      />

      <View
        style={[
          styles.header,
          { top: topPad, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowAddSheet(true)}
            style={[styles.headerIconBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
          >
            {picking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="videocam-outline" size={16} color="#fff" />
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/edit-profile")}
            style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Feather name="edit-2" size={14} color={colors.foreground} />
            <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showAddSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAddSheet(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Add a Workout Video
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.sheetOption,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => pickVideo("camera")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>
                  Record Video
                </Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
                  Film your workout right now
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sheetOption,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => pickVideo("library")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.buddy}18` }]}>
                <Ionicons name="images-outline" size={26} color={colors.buddy} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>
                  Choose from Library
                </Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>
                  Pick an existing video
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    gap: 12,
    paddingTop: 20,
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  heroStats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLbl: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 32,
  },
  nameSection: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  age: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginLeft: 2,
  },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  gym: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  checkinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
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
  separator: {
    height: 1,
    marginVertical: 8,
  },
  videosSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  addVideoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAddCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 28,
    marginTop: 12,
    alignItems: "center",
    gap: 12,
  },
  emptyAddCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  sheetOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionText: {
    flex: 1,
    gap: 3,
  },
  sheetOptionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  sheetOptionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});

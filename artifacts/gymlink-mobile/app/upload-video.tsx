import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRequestUploadUrl,
  useCreateWorkoutVideo,
  getListWorkoutVideosQueryKey,
} from "@workspace/api-client-react";
import { getPendingVideo, clearPendingVideo } from "@/store/videoStore";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function formatDuration(ms?: number): string {
  if (!ms) return "";
  const secs = Math.round(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadVideoScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const video = getPendingVideo();
  const [title, setTitle] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "saving">("idle");
  const titleRef = useRef<TextInput>(null);

  const { mutateAsync: requestUploadUrl } = useRequestUploadUrl();
  const { mutateAsync: createVideo } = useCreateWorkoutVideo();

  useEffect(() => {
    if (!video) {
      router.back();
    }
    setTimeout(() => titleRef.current?.focus(), 400);
  }, []);

  if (!video) return null;

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert("Add a title", "Give your video a title before posting.");
      return;
    }
    Keyboard.dismiss();
    setIsPosting(true);
    setProgress("uploading");

    try {
      const { uploadURL, objectPath } = await requestUploadUrl({
        data: {
          name: video.fileName,
          size: video.fileSize,
          contentType: video.mimeType,
        },
      });

      const fileResponse = await fetch(video.uri);
      const blob = await fileResponse.blob();
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": video.mimeType },
        body: blob,
      });

      setProgress("saving");

      await createVideo({
        data: { objectPath, title: title.trim() },
      });

      await queryClient.invalidateQueries({ queryKey: getListWorkoutVideosQueryKey() });
      clearPendingVideo();
      router.back();
    } catch {
      Alert.alert("Upload failed", "Something went wrong. Please try again.");
      setIsPosting(false);
      setProgress("idle");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            clearPendingVideo();
            router.back();
          }}
          style={styles.closeBtn}
          hitSlop={12}
          disabled={isPosting}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.topBarTitle}>New Post</Text>
        <Pressable
          onPress={handlePost}
          disabled={isPosting || !title.trim()}
          style={({ pressed }) => [
            styles.postBtn,
            (!title.trim() || isPosting) && styles.postBtnDisabled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.previewArea}>
        <View style={styles.videoPlaceholder}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={36} color="#fff" />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {video.fileName}
          </Text>
          <View style={styles.metaRow}>
            {video.duration != null && (
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>{formatDuration(video.duration)}</Text>
              </View>
            )}
            <View style={styles.metaPill}>
              <Ionicons name="document-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{formatSize(video.fileSize)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.captionArea, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.inputRow}>
          <Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            ref={titleRef}
            style={styles.input}
            placeholder="Describe your workout..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={120}
            returnKeyType="done"
            blurOnSubmit
            editable={!isPosting}
          />
        </View>
        <Text style={styles.charCount}>{title.length}/120</Text>

        {progress !== "idle" && (
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color="#E8193C" />
            <Text style={styles.progressText}>
              {progress === "uploading" ? "Uploading video…" : "Saving post…"}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0D1A",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  postBtn: {
    backgroundColor: "#E8193C",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  videoPlaceholder: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 380,
    backgroundColor: "#151829",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(232,25,60,0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(232,25,60,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    paddingHorizontal: 24,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  captionArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#fff",
    minHeight: 44,
    lineHeight: 22,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "right",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  progressText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
});

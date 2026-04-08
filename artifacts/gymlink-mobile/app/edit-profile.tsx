import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarImage } from "@/components/AvatarImage";
import { useColors } from "@/hooks/useColors";
import {
  useGetMe,
  useUpdateMe,
  useRequestUploadUrl,
  getGetMeQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

const PRESETS = [
  "Powerlifting", "Bodybuilding", "CrossFit", "Running", "Yoga", "HIIT",
  "Nutrition", "Cardio", "Flexibility", "Kettlebells", "Boxing", "Cycling",
  "Swimming", "Pilates", "Calisthenics", "Olympic Lifting", "Mobility",
  "Meal Prep", "Posing", "Jump Rope", "Functional Training", "Beginner Lifting",
];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const { data: me, isLoading } = useGetMe();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMe();
  const { mutateAsync: requestUploadUrl } = useRequestUploadUrl();

  const [bio, setBio] = useState("");
  const [schedule, setSchedule] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (me && !initialized.current) {
      initialized.current = true;
      setBio(me.bio ?? "");
      setSchedule(me.schedule ?? "");
      setInterests(me.interests ?? []);
      setAvatarUrl(me.avatarUrl ?? null);
    }
  }, [me]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const pickAndUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos to upload a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = `avatar-${Date.now()}.jpg`;
    const fileSize = asset.fileSize ?? 500_000;
    const contentType = "image/jpeg";

    setIsUploadingPhoto(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl({
        data: { name: fileName, size: fileSize, contentType },
      });

      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });

      const publicUrl = `${API_BASE}/api/storage${objectPath}`;
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Upload failed", "Could not upload your photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateMe({ data: { bio, schedule, interests, avatarUrl: avatarUrl ?? undefined } });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      router.back();
    } catch {
      Alert.alert("Save failed", "Could not save your profile. Please try again.");
    }
  };

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  if (isLoading || !me) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Edit Profile
        </Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAndUploadPhoto} disabled={isUploadingPhoto} style={styles.avatarWrap}>
            <AvatarImage
              avatarUrl={avatarUrl}
              avatarEmoji={me.avatar}
              size={96}
            />
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={16} color="#fff" />
              )}
            </View>
          </Pressable>
          <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
            Tap to change photo
          </Text>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>BIO</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the gym what you're about..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              styles.textArea,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
          />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>SCHEDULE</Text>
          <TextInput
            value={schedule}
            onChangeText={setSchedule}
            placeholder="e.g. Mon-Fri 6PM"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>INTERESTS</Text>
          <Text style={[styles.interestHint, { color: colors.mutedForeground }]}>
            Tap to select what you train for
          </Text>
          <View style={styles.chips}>
            {PRESETS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {interest}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  avatarSection: {
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  section: {
    gap: 10,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: "top",
  },
  interestHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: -4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});

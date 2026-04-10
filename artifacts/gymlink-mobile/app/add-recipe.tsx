import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  useRequestUploadUrl,
  useCreateRecipe,
  getListRecipesQueryKey,
} from "@workspace/api-client-react";
import { getPendingRecipeMedia, clearPendingRecipeMedia } from "@/store/recipeMediaStore";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function AddRecipeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const media = getPendingRecipeMedia();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientsRaw, setIngredientsRaw] = useState("");
  const [stepsRaw, setStepsRaw] = useState("");
  const [progress, setProgress] = useState<"idle" | "uploading" | "saving">("idle");

  const { mutateAsync: requestUploadUrl } = useRequestUploadUrl();
  const { mutateAsync: createRecipe } = useCreateRecipe();

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a recipe name.");
      return;
    }

    setProgress("uploading");

    try {
      let mediaObjectPath: string | undefined;
      let mediaType: string | undefined;

      if (media?.uri) {
        const { uploadURL, objectPath } = await requestUploadUrl({
          data: { name: media.fileName, size: media.fileSize, contentType: media.mimeType },
        });

        const fileRes = await fetch(media.uri);
        const blob = await fileRes.blob();

        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": media.mimeType },
          body: blob,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        mediaObjectPath = objectPath;
        mediaType = media.mediaType;
      }

      setProgress("saving");

      const ingredients = ingredientsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const steps = stepsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await createRecipe({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          ingredients,
          steps,
          mediaObjectPath,
          mediaType,
        },
      });

      clearPendingRecipeMedia();
      queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
      router.replace("/(tabs)/recipes");
    } catch (err) {
      Alert.alert("Error", "Could not save recipe. Please try again.");
      setProgress("idle");
    }
  };

  const busy = progress !== "idle";

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => { clearPendingRecipeMedia(); router.back(); }} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Recipe</Text>
        <Pressable
          onPress={handleSave}
          disabled={busy || !title.trim()}
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: busy || !title.trim() ? 0.5 : 1 }]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      {busy && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progress === "uploading" ? "50%" : "90%",
              },
            ]}
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {media?.uri && (
          <View style={styles.mediaPreview}>
            {media.mediaType === "image" ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.previewImg}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.videoPlaceholder, { backgroundColor: colors.muted }]}>
                <Ionicons name="videocam" size={40} color={colors.mutedForeground} />
                <Text style={[styles.videoLabel, { color: colors.mutedForeground }]}>
                  Video attached
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Recipe Name *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. High-Protein Chicken Bowl"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief overview of the recipe..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Ingredients (one per line)</Text>
            <TextInput
              value={ingredientsRaw}
              onChangeText={setIngredientsRaw}
              placeholder={"200g chicken breast\n1 cup brown rice\n1 tbsp olive oil"}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 100 }]}
              multiline
              textAlignVertical="top"
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Steps (one per line)</Text>
            <TextInput
              value={stepsRaw}
              onChangeText={setStepsRaw}
              placeholder={"Season chicken with salt and pepper\nCook rice per package instructions\nGrill chicken 6 min per side"}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 120 }]}
              multiline
              textAlignVertical="top"
              editable={!busy}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  progressBar: { height: 3 },
  progressFill: { height: 3, borderRadius: 2, transition: "width 0.3s" } as any,
  scroll: { padding: 16, gap: 0 },
  mediaPreview: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  previewImg: { width: "100%", height: 200 },
  videoPlaceholder: {
    height: 140,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  videoLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
  },
});

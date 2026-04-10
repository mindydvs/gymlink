import { Ionicons } from "@expo/vector-icons";
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
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  useListRecipes,
  useDeleteRecipe,
  useGetMe,
  getListRecipesQueryKey,
} from "@workspace/api-client-react";
import { setPendingRecipeMedia, clearPendingRecipeMedia } from "@/store/recipeMediaStore";
import { AvatarImage } from "@/components/AvatarImage";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function mediaUrl(objectPath: string) {
  return `${API_BASE}/api/storage${objectPath}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Recipe = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  ingredients: string[];
  steps: string[];
  mediaObjectPath?: string | null;
  mediaType?: string | null;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string | null; avatarUrl?: string | null } | null;
};

function RecipeCard({
  recipe,
  myId,
  colors,
  onDelete,
}: {
  recipe: Recipe;
  myId: string;
  colors: ReturnType<typeof useColors>;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardTop}>
        <AvatarImage
          avatarUrl={recipe.user?.avatarUrl ?? null}
          avatarEmoji={recipe.user?.avatar ?? "🍽️"}
          size={36}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
            {recipe.user?.name ?? "Unknown"}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(recipe.createdAt)}
          </Text>
        </View>
        {recipe.userId === myId && (
          <Pressable
            onPress={() => onDelete(recipe.id)}
            hitSlop={8}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color="#E8193C" />
          </Pressable>
        )}
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{recipe.title}</Text>
      {recipe.description ? (
        <Text
          style={[styles.description, { color: colors.mutedForeground }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {recipe.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: `${colors.advisor}18` }]}>
          <Ionicons name="list-outline" size={12} color={colors.advisor} />
          <Text style={[styles.pillText, { color: colors.advisor }]}>
            {recipe.ingredients.length} ingredients
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: `${colors.buddy}18` }]}>
          <Ionicons name="footsteps-outline" size={12} color={colors.buddy} />
          <Text style={[styles.pillText, { color: colors.buddy }]}>
            {recipe.steps.length} steps
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          {recipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ingredients</Text>
              {recipe.ingredients.map((ing, i) => (
                <Text key={i} style={[styles.listItem, { color: colors.foreground }]}>
                  · {ing}
                </Text>
              ))}
            </View>
          )}
          {recipe.steps.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Steps</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function RecipesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: me } = useGetMe();
  const { data: recipes, isLoading, refetch, isRefetching } = useListRecipes();
  const deleteRecipeMutation = useDeleteRecipe();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [picking, setPicking] = useState(false);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Recipe", "Remove this recipe?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteRecipeMutation.mutate(
            { id },
            {
              onSuccess: () =>
                queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() }),
            }
          );
        },
      },
    ]);
  };

  const launchPicker = async (source: "library" | "camera", mediaTypes: "images" | "videos") => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Camera Access Needed",
            "Please allow camera access in Settings to take photos or videos.",
            [{ text: "OK" }]
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes,
          quality: 0.8,
          videoMaxDuration: 120,
          allowsEditing: false,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Photo Library Access Needed",
            "Please allow photo library access in Settings to pick photos or videos.",
            [{ text: "OK" }]
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes,
          quality: 1,
          allowsEditing: false,
        });
      }

      if (!result || result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType ?? (mediaTypes === "videos" ? "video/mp4" : "image/jpeg");
      const fileSize = asset.fileSize ?? 0;
      const parts = uri.split("/");
      const fileName = parts[parts.length - 1] ?? `media-${Date.now()}`;

      clearPendingRecipeMedia();
      setPendingRecipeMedia({
        uri,
        mimeType,
        fileSize,
        fileName,
        mediaType: mediaTypes === "videos" ? "video" : "image",
      });
      router.push("/add-recipe");
    } catch (err) {
      Alert.alert("Error", "Could not open media picker. Please try again.");
    } finally {
      setPicking(false);
    }
  };

  const pickMedia = (source: "library" | "camera", mediaTypes: "images" | "videos") => {
    setShowAddSheet(false);
    setPicking(true);
    // Give the bottom sheet time to fully dismiss before launching the native picker
    setTimeout(() => launchPicker(source, mediaTypes), 400);
  };

  const goToAddNoMedia = () => {
    setShowAddSheet(false);
    clearPendingRecipeMedia();
    router.push("/add-recipe");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={(recipes as Recipe[]) ?? []}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPad + 56, paddingBottom: Platform.OS === "web" ? 34 : 120 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }]}>
                <Ionicons name="restaurant-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No recipes yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Share a healthy recipe with your gym community
              </Text>
              <Pressable
                onPress={() => setShowAddSheet(true)}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add First Recipe</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListHeaderComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} /> : null
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item as Recipe}
            myId={me?.id ?? ""}
            colors={colors}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <View
        style={[
          styles.header,
          { top: topPad, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recipes</Text>
        <Pressable
          onPress={() => setShowAddSheet(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          hitSlop={8}
        >
          {picking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showAddSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAddSheet(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add a Recipe</Text>

            <Pressable
              style={({ pressed }) => [styles.sheetOption, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => pickMedia("camera", "images")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Take a Photo</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>Snap your dish</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.sheetOption, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => pickMedia("camera", "videos")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.crush}18` }]}>
                <Ionicons name="videocam-outline" size={26} color={colors.crush} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Record Video</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>Film how it's made</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.sheetOption, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => pickMedia("library", "images")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.advisor}18` }]}>
                <Ionicons name="images-outline" size={26} color={colors.advisor} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Choose Photo</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>From library</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.sheetOption, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => pickMedia("library", "videos")}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.buddy}18` }]}>
                <Ionicons name="film-outline" size={26} color={colors.buddy} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Upload Video</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>Pick from your library</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.sheetOption, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={goToAddNoMedia}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: `${colors.spotter}18` }]}>
                <Ionicons name="document-text-outline" size={26} color={colors.spotter} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.foreground }]}>Text Only</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.mutedForeground }]}>Just ingredients & steps</Text>
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
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  list: { paddingHorizontal: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  deleteBtn: { padding: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16, lineHeight: 22 },
  description: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: "row", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  pillText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  expanded: { borderTopWidth: 1, paddingTop: 12, gap: 12 },
  section: { gap: 6 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  listItem: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    marginTop: 16,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 },
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
  sheetOptionText: { flex: 1, gap: 3 },
  sheetOptionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sheetOptionSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
});

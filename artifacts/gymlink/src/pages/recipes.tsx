import { useState, useRef } from "react";
import { ChefHat, Plus, X, Trash2, Upload, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRecipes,
  useCreateRecipe,
  useDeleteRecipe,
  useGetMe,
  getListRecipesQueryKey,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/gymlink$/, "");

function mediaUrl(objectPath: string) {
  return `${window.location.origin}${API_BASE}/api/storage${objectPath}`;
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

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description?: string | null;
    ingredients: string[];
    steps: string[];
    mediaObjectPath?: string | null;
    mediaType?: string | null;
    createdAt: string;
    user?: { id: string; name: string; avatar?: string | null; avatarUrl?: string | null } | null;
    userId: string;
  };
  myId: string;
  onDelete: (id: string) => void;
}

function RecipeCard({ recipe, myId, onDelete }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card-surface overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
      onClick={() => setExpanded((v) => !v)}
    >
      {recipe.mediaObjectPath && (
        <div className="relative w-full" style={{ maxHeight: 260, overflow: "hidden" }}>
          {recipe.mediaType === "video" ? (
            <video
              src={mediaUrl(recipe.mediaObjectPath)}
              className="w-full object-cover"
              style={{ maxHeight: 260 }}
              controls
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={mediaUrl(recipe.mediaObjectPath)}
              alt={recipe.title}
              className="w-full object-cover"
              style={{ maxHeight: 260 }}
            />
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0"
              style={{ background: "hsl(var(--secondary))" }}
            >
              {recipe.user?.avatarUrl ? (
                <img
                  src={mediaUrl(recipe.user.avatarUrl)}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{recipe.user?.avatar ?? "🍽️"}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                {recipe.user?.name ?? "Unknown"}
              </p>
              <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {timeAgo(recipe.createdAt)}
              </p>
            </div>
          </div>
          {recipe.userId === myId && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
              className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: "#E8193C" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold leading-snug">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {recipe.description}
            </p>
          )}
        </div>

        <div className="flex gap-3 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>{recipe.ingredients.length} ingredients</span>
          <span>·</span>
          <span>{recipe.steps.length} steps</span>
        </div>

        {expanded && (
          <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
            {recipe.ingredients.length > 0 && (
              <div>
                <p className="section-label mb-1.5">Ingredients</p>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: "hsl(var(--foreground))" }}>
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>·</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.steps.length > 0 && (
              <div>
                <p className="section-label mb-1.5">Steps</p>
                <ol className="space-y-1.5">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="text-sm flex gap-2.5">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                        style={{ background: "hsl(var(--primary))" }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: "hsl(var(--foreground))" }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AddRecipeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddRecipeModal({ onClose, onSuccess }: AddRecipeModalProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientsRaw, setIngredientsRaw] = useState("");
  const [stepsRaw, setStepsRaw] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createRecipe = useCreateRecipe();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      let mediaObjectPath: string | undefined;
      let mediaType: string | undefined;

      if (mediaFile) {
        const result = await uploadFile(mediaFile);
        if (!result) throw new Error("Upload failed");
        mediaObjectPath = result.objectPath;
        mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
      }

      const ingredients = ingredientsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const steps = stepsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await createRecipe.mutateAsync({
        data: { title: title.trim(), description: description.trim() || undefined, ingredients, steps, mediaObjectPath, mediaType },
      });

      toast({ title: "Recipe added!" });
      onSuccess();
    } catch {
      toast({ title: "Error", description: "Could not save recipe", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isUploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <h2 className="text-lg font-bold">Add Recipe</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="section-label block mb-1.5">Photo or Video</label>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 200 }}>
                {mediaFile?.type.startsWith("video") ? (
                  <video src={mediaPreview} className="w-full object-cover" style={{ maxHeight: 200 }} controls />
                ) : (
                  <img src={mediaPreview} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Upload photo or video</span>
                <span className="text-xs">Optional</span>
              </button>
            )}
          </div>

          <div>
            <label className="section-label block mb-1.5">Recipe Name *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High-Protein Chicken Bowl"
              className="w-full h-10 px-3 rounded-lg text-sm border"
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              required
            />
          </div>

          <div>
            <label className="section-label block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quick overview of the recipe..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          <div>
            <label className="section-label block mb-1.5">Ingredients (one per line)</label>
            <textarea
              value={ingredientsRaw}
              onChange={(e) => setIngredientsRaw(e.target.value)}
              placeholder={"200g chicken breast\n1 cup brown rice\n1 tbsp olive oil"}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none font-mono"
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          <div>
            <label className="section-label block mb-1.5">Steps (one per line)</label>
            <textarea
              value={stepsRaw}
              onChange={(e) => setStepsRaw(e.target.value)}
              placeholder={"Season the chicken with salt and pepper\nCook rice according to package\nGrill chicken for 6 min per side"}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "hsl(var(--primary))" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
              {busy ? "Saving..." : "Save Recipe"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Recipes() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const { data: recipes, isLoading } = useListRecipes();
  const deleteRecipe = useDeleteRecipe();
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    deleteRecipe.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          toast({ title: "Recipe deleted" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-label mb-1">Community</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Recipes</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          <Plus className="w-4 h-4" /> Add Recipe
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface p-4 h-48 animate-pulse" style={{ background: "hsl(var(--card))" }} />
          ))}
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="space-y-4">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              myId={me?.id ?? ""}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--secondary))" }}
          >
            <ChefHat className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">No recipes yet</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              Be the first to share a healthy recipe with your gym community
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Plus className="w-4 h-4" /> Add First Recipe
          </button>
        </div>
      )}

      {showAdd && (
        <AddRecipeModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          }}
        />
      )}
    </div>
  );
}

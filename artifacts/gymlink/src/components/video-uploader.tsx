import { useRef, useState } from "react";
import { Video, Upload, Loader2, Trash2, Play } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";
import { useListWorkoutVideos, useCreateWorkoutVideo, useDeleteWorkoutVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MAX_DURATION_SEC = 120;
const MAX_FILE_MB = 200;

interface VideoUploaderProps {
  userId: string;
  isOwner: boolean;
}

export function VideoUploader({ userId, isOwner }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [titleInput, setTitleInput] = useState("");
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: videos = [], isLoading } = useListWorkoutVideos({ userId } as { userId: string });
  const createVideo = useCreateWorkoutVideo();
  const deleteVideo = useDeleteWorkoutVideo();

  const { uploadFile, isUploading, progress } = useUpload({
    basePath: "/api/storage",
    onSuccess: (response) => {
      setPendingPath(response.objectPath);
    },
    onError: () => toast({ title: "Upload failed", description: "Please try again", variant: "destructive" }),
  });

  const validateVideo = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > MAX_DURATION_SEC) {
          toast({ title: "Too long", description: "Max 2 minutes", variant: "destructive" });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => resolve(true);
      video.src = url;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Videos only", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: "Too large", description: `Max ${MAX_FILE_MB}MB`, variant: "destructive" });
      return;
    }
    const valid = await validateVideo(file);
    if (!valid) return;
    setTitleInput(file.name.replace(/\.[^/.]+$/, ""));
    await uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSave = () => {
    if (!pendingPath || !titleInput.trim()) return;
    createVideo.mutate(
      { data: { objectPath: pendingPath, title: titleInput.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listWorkoutVideos"] });
          setPendingPath(null);
          setTitleInput("");
          toast({ title: "Video saved!" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteVideo.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listWorkoutVideos"] });
        toast({ title: "Video deleted" });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload area - only for owner */}
      {isOwner && (
        <div>
          {!pendingPath && !isUploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:opacity-80"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              <Upload className="w-4 h-4" />
              Upload workout video (max 2 min)
            </button>
          )}

          {isUploading && (
            <div className="w-full py-3 px-4 rounded-xl border flex items-center gap-3"
              style={{ borderColor: "hsl(var(--border))" }}>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "hsl(var(--primary))" }} />
              <div className="flex-1">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--secondary))" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "hsl(var(--primary))" }} />
                </div>
              </div>
            </div>
          )}

          {pendingPath && !isUploading && (
            <div className="p-3 rounded-xl space-y-2 border" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Add a title for your video</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Deadlift form check"
                  className="flex-1 h-9 px-3 rounded-lg border text-sm"
                  style={{ background: "hsl(var(--input))", border: "1px solid hsl(var(--border))" }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={!titleInput.trim() || createVideo.isPending}
                  className="px-3 h-9 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setPendingPath(null); setTitleInput(""); }}
                  className="px-3 h-9 rounded-lg text-sm font-semibold"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* Video list */}
      {isLoading && (
        <div className="flex items-center justify-center py-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {!isLoading && videos.length === 0 && (
        <div className="text-center py-6 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isOwner ? "No workout videos yet — upload one above" : "No workout videos posted yet"}
        </div>
      )}

      <div className="space-y-3">
        {videos.map((v) => (
          <div key={v.id} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--secondary))" }}>
            {playingId === v.id ? (
              <video
                src={`/api/storage${v.objectPath}`}
                controls
                autoPlay
                className="w-full max-h-64 bg-black"
                onEnded={() => setPlayingId(null)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlayingId(v.id)}
                className="relative w-full aspect-video flex items-center justify-center group"
                style={{ background: "#0a0f1e" }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "hsl(var(--primary) / 0.9)" }}>
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-left"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                  <p className="text-sm font-bold text-white truncate">{v.title}</p>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <Video className="w-3 h-3" />
                    <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            )}

            {isOwner && (
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-xs font-semibold truncate">{v.title}</p>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-70 shrink-0"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

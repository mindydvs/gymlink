import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  emoji: string;
  onUploaded: (objectPath: string) => void;
  size?: "sm" | "lg";
}

export function AvatarUploader({ currentAvatarUrl, emoji, onUploaded, size = "lg" }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    basePath: "/api/storage",
    onSuccess: (response) => {
      onUploaded(response.objectPath);
      toast({ title: "Photo updated!" });
    },
    onError: () => toast({ title: "Upload failed", description: "Please try again", variant: "destructive" }),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Images only", description: "Please select a photo", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10MB for photos", variant: "destructive" });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    await uploadFile(file);
  };

  const dim = size === "lg" ? "w-20 h-20 text-4xl" : "w-12 h-12 text-2xl";
  const imgSrc = previewUrl ?? (currentAvatarUrl ? `/api/storage${currentAvatarUrl}` : null);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`${dim} rounded-2xl flex items-center justify-center overflow-hidden transition-all group`}
        style={{ background: "hsl(var(--secondary))" }}
      >
        {imgSrc ? (
          <img src={imgSrc} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          {isUploading
            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
            : <Camera className="w-5 h-5 text-white" />
          }
        </div>
      </button>

      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center pointer-events-none"
        style={{ background: "hsl(var(--primary))" }}>
        <Camera className="w-3 h-3 text-white" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export interface PendingRecipeMedia {
  uri: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  mediaType: "image" | "video";
}

let pending: PendingRecipeMedia | null = null;

export function setPendingRecipeMedia(media: PendingRecipeMedia) {
  pending = media;
}

export function getPendingRecipeMedia(): PendingRecipeMedia | null {
  return pending;
}

export function clearPendingRecipeMedia() {
  pending = null;
}

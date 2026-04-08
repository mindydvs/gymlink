export interface PendingVideo {
  uri: string;
  mimeType: string;
  fileSize: number;
  duration?: number;
  fileName: string;
}

let pending: PendingVideo | null = null;

export function setPendingVideo(video: PendingVideo) {
  pending = video;
}

export function getPendingVideo(): PendingVideo | null {
  return pending;
}

export function clearPendingVideo() {
  pending = null;
}

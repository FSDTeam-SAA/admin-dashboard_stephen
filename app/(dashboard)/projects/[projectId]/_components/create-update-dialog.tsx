"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo } from "react";
import { Plus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  selectedFiles: File[];
  isSubmitting: boolean;
  onDescriptionChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function CreateUpdateDialog({
  open,
  onOpenChange,
  description,
  selectedFiles,
  isSubmitting,
  onDescriptionChange,
  onFilesChange,
  onRemoveFile,
  onSubmit,
  onCancel,
}: CreateUpdateDialogProps) {
  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const mediaSummary = useMemo(() => {
    const imageCount = selectedFiles.filter((file) => file.type.startsWith("image/")).length;
    const videoCount = selectedFiles.filter((file) => file.type.startsWith("video/")).length;

    return { imageCount, videoCount };
  }, [selectedFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-[#2f3c44] bg-[#141d1f] p-0 [&>button]:hidden">
        <form
          className="space-y-6 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              type="button"
              className="text-title-24 text-[#e5d4b6] transition hover:text-white"
              onClick={onCancel}
            >
              Cancel
            </button>
            <h2 className="text-title-24 text-center text-white">New Post</h2>
            <Button
              type="submit"
              className="min-w-[114px] rounded-full bg-[#bf9870] px-7 text-white hover:bg-[#c7a680]"
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="project-update-media"
              className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[32px] border-4 border-dashed border-[#dcc7a0] bg-[#182124] px-6 py-10 text-center transition hover:border-[#ecdcb9]"
            >
              <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-[#dcc7a0]">
                <Plus className="h-10 w-10" />
              </span>
              <span className="text-title-24 text-white">Add site media</span>
              <span className="mt-2 text-body-16 text-white/55">
                Upload multiple images and videos for this site update
              </span>
              {selectedFiles.length > 0 ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#314149] bg-[#10181b] px-4 py-2 text-xs text-[#e7d8b8]">
                  <span>{mediaSummary.imageCount} images</span>
                  <span className="h-1 w-1 rounded-full bg-[#ccb789]" />
                  <span>{mediaSummary.videoCount} videos</span>
                  <span className="h-1 w-1 rounded-full bg-[#ccb789]" />
                  <span>{selectedFiles.length} selected</span>
                </div>
              ) : null}
            </label>
            <Input
              id="project-update-media"
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => {
                onFilesChange(event.target.files ? Array.from(event.target.files) : []);
                event.target.value = "";
              }}
            />

            {selectedFiles.length > 0 ? (
              <div className="grid max-h-[280px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
                {selectedFiles.map((file, index) => {
                  const previewUrl = previewUrls[index];
                  const isVideo = file.type.startsWith("video/");

                  return (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="overflow-hidden rounded-[24px] border border-[#314149] bg-[#10181b]"
                    >
                      <div className="relative aspect-[4/3] bg-[#0c1110]">
                        {previewUrl ? (
                          isVideo ? (
                            <video
                              src={previewUrl}
                              className="h-full w-full object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          )
                        ) : null}
                        <button
                          type="button"
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
                          onClick={() => onRemoveFile(index)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {isVideo ? (
                          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
                            <Video className="h-3 w-3" />
                            Video
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 px-3 py-3">
                        <p className="truncate text-xs font-medium text-white/90">{file.name}</p>
                        <p className="text-[11px] text-white/45">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Enter description..."
              className="min-h-[180px] rounded-[28px] border-0 bg-[#242829] px-7 py-6 text-title-24 text-white placeholder:text-white/25 focus-visible:ring-2 focus-visible:ring-[#a58a3b]/60"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

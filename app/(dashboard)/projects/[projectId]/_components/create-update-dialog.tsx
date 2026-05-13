"use client";

import { Plus } from "lucide-react";
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
  onFilesChange: (files: FileList | null) => void;
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
  onSubmit,
  onCancel,
}: CreateUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[#2f3c44] bg-[#141d1f] p-0 [&>button]:hidden">
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
              className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[32px] border-4 border-dashed border-[#dcc7a0] bg-[#182124] px-6 py-10 text-center transition hover:border-[#ecdcb9]"
            >
              <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-[#dcc7a0]">
                <Plus className="h-10 w-10" />
              </span>
              <span className="text-title-24 text-white">Add site photo</span>
              <span className="mt-2 text-body-16 text-white/55">
                Upload images or videos for this site update
              </span>
              {selectedFiles.length > 0 ? (
                <div className="mt-5 flex max-w-full flex-wrap justify-center gap-2">
                  {selectedFiles.map((file) => (
                    <span
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="max-w-full truncate rounded-full border border-[#314149] bg-[#10181b] px-4 py-2 text-xs text-[#e7d8b8]"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </label>
            <Input
              id="project-update-media"
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => onFilesChange(event.target.files)}
            />

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

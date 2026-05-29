import type { ProjectProgressUpdate } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDateTime, getInitials } from "./utils";

type ProgressTabProps = {
  progressUpdates: ProjectProgressUpdate[];
  onEditProgress: (progressUpdate: ProjectProgressUpdate) => void;
  onDeleteProgress: (progressUpdate: ProjectProgressUpdate) => void;
};

const getUpdatedByMeta = (updatedBy?: ProjectProgressUpdate["updatedBy"]) => {
  if (!updatedBy || typeof updatedBy === "string") {
    return { name: "Unavailable", email: "", avatarUrl: "" };
  }
  return {
    name: updatedBy.name || "Unknown User",
    email: updatedBy.email || "",
    avatarUrl: updatedBy.avatar?.url || "",
  };
};

export function ProgressTab({
  progressUpdates,
  onEditProgress,
  onDeleteProgress,
}: ProgressTabProps) {
  if (progressUpdates.length === 0) {
    return (
      <Card className="border-[#24313a] bg-[#111a20] p-5">
        <p className="text-body-16 text-white/70">No progress updates yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {progressUpdates.map((progressUpdate, index) => {
        const updatedBy = getUpdatedByMeta(progressUpdate.updatedBy);

        return (
          <div key={progressUpdate._id} className="relative pl-9">
            {index < progressUpdates.length - 1 ? (
              <span className="absolute left-[12px] top-8 bottom-[-18px] w-px bg-[#29404d]" />
            ) : null}

            {/* Timeline bullet — percent is not displayed; entries are informational only */}
            <span className="absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-[#3b5b6b] bg-[#0d151a]">
              <span className="h-2 w-2 rounded-full bg-[#e8d38b]" />
            </span>

            <Card className="border-[#24313a] bg-[#111a20] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f97a5]">
                      Progress Update
                    </p>
                    <h3 className="text-title-24 text-white">
                      {progressUpdate.progressName || "Untitled Progress"}
                    </h3>
                  </div>

                  {progressUpdate.note ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f97a5]">
                        Note
                      </p>
                      <p className="text-body-16 leading-relaxed text-white/80">
                        {progressUpdate.note}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#335160] bg-[#0d151a] text-[#e8d38b] transition hover:border-[#4f7283] hover:text-[#f5e6af]"
                    onClick={() => onEditProgress(progressUpdate)}
                    aria-label="Edit progress update"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#5b2a2a] bg-[#0d151a] text-red-400 transition hover:border-[#7a3a3a] hover:text-red-300"
                    onClick={() => onDeleteProgress(progressUpdate)}
                    aria-label="Delete progress update"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#24313a] pt-4 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {updatedBy.avatarUrl ? (
                    <div
                      className="h-10 w-10 rounded-full border border-[#2a424f] bg-cover bg-center"
                      style={{ backgroundImage: `url(${updatedBy.avatarUrl})` }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a424f] bg-[#17303a] text-xs font-semibold text-white">
                      {getInitials(updatedBy.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f97a5]">
                      Updated By
                    </p>
                    <p className="text-sm text-white/90">{updatedBy.name}</p>
                    {updatedBy.email ? (
                      <p className="text-xs text-white/55">{updatedBy.email}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1 text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f97a5]">
                    Updated Date
                  </p>
                  <p className="text-sm text-white/90">
                    {formatDateTime(progressUpdate.updatedAt)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

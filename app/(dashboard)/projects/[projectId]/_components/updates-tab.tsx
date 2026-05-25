"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type MouseEvent, type RefObject } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  MessageCircle,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import type { CommentItem, UpdateItem } from "@/lib/api";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelativeTime, getInitials } from "./utils";

type UpdatesTabProps = {
  updates: UpdateItem[];
  activeUpdateId: string | null;
  selectedUpdate: UpdateItem | null;
  comments: CommentItem[];
  commentsLoading: boolean;
  updateCommentText: string;
  commentInputRef: RefObject<HTMLInputElement | null>;
  isSendingComment: boolean;
  onUpdateCommentTextChange: (value: string) => void;
  onSelectUpdate: (updateId: string) => void;
  onLike: (updateId: string) => void;
  onDeleteUpdate: (update: UpdateItem) => void;
  onSendComment: () => void;
};

type UpdateMediaItem = {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
};

const UPDATES_PER_PAGE = 4;

const getUpdateMedia = (update: UpdateItem): UpdateMediaItem[] => {
  const images = (update.images ?? [])
    .filter((item) => Boolean(item?.url))
    .map((item) => ({
      type: "image" as const,
      url: item.url,
    }));

  const videos = (update.videos ?? [])
    .filter((item) => Boolean(item?.url))
    .map((item) => ({
      type: "video" as const,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
    }));

  return [...images, ...videos];
};

const stopEvent = (event: MouseEvent<HTMLButtonElement>) => {
  event.stopPropagation();
};

export function UpdatesTab({
  updates,
  activeUpdateId,
  selectedUpdate,
  comments,
  commentsLoading,
  updateCommentText,
  commentInputRef,
  isSendingComment,
  onUpdateCommentTextChange,
  onSelectUpdate,
  onLike,
  onDeleteUpdate,
  onSendComment,
}: UpdatesTabProps) {
  const [page, setPage] = useState(1);
  const [mediaIndexByUpdate, setMediaIndexByUpdate] = useState<Record<string, number>>(
    {},
  );

  const totalPages = Math.max(1, Math.ceil(updates.length / UPDATES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedUpdates = useMemo(() => {
    const start = (currentPage - 1) * UPDATES_PER_PAGE;
    return updates.slice(start, start + UPDATES_PER_PAGE);
  }, [currentPage, updates]);

  const setMediaIndex = (updateId: string, nextIndex: number) => {
    setMediaIndexByUpdate((current) => ({
      ...current,
      [updateId]: nextIndex,
    }));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-start">
      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card className="border-[#24313a] bg-[#111a20] p-5">
            <p className="text-body-16 text-white/70">No updates yet.</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedUpdates.map((update) => {
                const mediaItems = getUpdateMedia(update);
                const currentMediaIndex = Math.min(
                  mediaIndexByUpdate[update._id] ?? 0,
                  Math.max(mediaItems.length - 1, 0),
                );
                const currentMedia = mediaItems[currentMediaIndex] ?? null;
                const uploaderName = update.uploadedBy?.name || "Unknown User";
                const uploaderRole = String(update.uploadedBy?.role || "site_manager")
                  .replace("-", " ")
                  .toUpperCase();
                const avatarUrl = update.uploadedBy?.avatar?.url;
                const likeCount = Number(update.stats?.likeCount ?? 0);
                const commentCount = Number(update.stats?.commentCount ?? 0);
                const isActive = activeUpdateId === update._id;

                return (
                  <Card
                    key={update._id}
                    className={`overflow-hidden border p-0 transition ${
                      isActive
                        ? "border-[#3f6176] bg-[#14212a] shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
                        : "border-[#24313a] bg-[#111a20] hover:bg-[#142029]"
                    }`}
                  >
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => onSelectUpdate(update._id)}
                    >
                      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                        <div className="space-y-3">
                          <div className="relative overflow-hidden rounded-[20px] border border-[#2a3943] bg-[#0d1418]">
                            <div className="aspect-[16/10]">
                              {currentMedia ? (
                                currentMedia.type === "image" ? (
                                  <img
                                    src={currentMedia.url}
                                    alt={update.description || "Project update image"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={currentMedia.url}
                                    poster={currentMedia.thumbnailUrl}
                                    controls
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                )
                              ) : (
                                <div className="flex h-full items-center justify-center bg-[#152028] text-sm text-white/60">
                                  No media uploaded
                                </div>
                              )}
                            </div>

                            {mediaItems.length > 1 ? (
                              <>
                                <button
                                  type="button"
                                  className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                                  onClick={(event) => {
                                    stopEvent(event);
                                    setMediaIndex(
                                      update._id,
                                      currentMediaIndex === 0
                                        ? mediaItems.length - 1
                                        : currentMediaIndex - 1,
                                    );
                                  }}
                                  aria-label="Previous media"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                                  onClick={(event) => {
                                    stopEvent(event);
                                    setMediaIndex(
                                      update._id,
                                      currentMediaIndex === mediaItems.length - 1
                                        ? 0
                                        : currentMediaIndex + 1,
                                    );
                                  }}
                                  aria-label="Next media"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </>
                            ) : null}

                            {mediaItems.length > 0 ? (
                              <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-[#0d1418]/85 px-3 py-1 text-[11px] font-medium text-white">
                                <span className="inline-flex items-center gap-1">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {update.images?.length ?? 0}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Video className="h-3.5 w-3.5" />
                                  {update.videos?.length ?? 0}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {mediaItems.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {mediaItems.map((media, index) => (
                                <button
                                  key={`${update._id}-${media.type}-${media.url}-${index}`}
                                  type="button"
                                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                                    index === currentMediaIndex
                                      ? "border-[#e8d38b] ring-2 ring-[#e8d38b]/20"
                                      : "border-[#2a3943] opacity-80 hover:opacity-100"
                                  }`}
                                  onClick={(event) => {
                                    stopEvent(event);
                                    setMediaIndex(update._id, index);
                                  }}
                                  aria-label={`Show media ${index + 1}`}
                                >
                                  {media.type === "image" ? (
                                    <img
                                      src={media.url}
                                      alt={`Preview ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <>
                                      <img
                                        src={media.thumbnailUrl || media.url}
                                        alt={`Video preview ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                                        <Video className="h-4 w-4" />
                                      </span>
                                    </>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex min-h-full flex-col justify-between gap-4">
                          <div className="space-y-3">
                            <p className="text-base leading-7 text-white/90">
                              {update.description || "-"}
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs text-white/60">
                              <span>{formatRelativeTime(update.createdAt)}</span>
                              <span className="h-1 w-1 rounded-full bg-white/30" />
                              <span>{mediaItems.length} media item{mediaItems.length === 1 ? "" : "s"}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 border-t border-[#24313a] pt-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex items-center gap-3">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={uploaderName}
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2d404b] text-xs font-semibold text-white">
                                  {getInitials(uploaderName)}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-white/90">
                                  {uploaderName}
                                </p>
                                <p className="text-[11px] tracking-[0.18em] text-white/50">
                                  {uploaderRole}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/30"
                                onClick={(event) => {
                                  stopEvent(event);
                                  onLike(update._id);
                                }}
                              >
                                <Heart className="h-4 w-4" />
                                {likeCount} Like{likeCount === 1 ? "" : "s"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#e8d38b] transition hover:border-white/30"
                                onClick={(event) => {
                                  stopEvent(event);
                                  onSelectUpdate(update._id);
                                  commentInputRef.current?.focus();
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                                {commentCount} Comment{commentCount === 1 ? "" : "s"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:border-white/30"
                                onClick={(event) => {
                                  stopEvent(event);
                                  onDeleteUpdate(update);
                                }}
                                aria-label="Delete project update"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center lg:justify-end">
              <PaginationBar page={currentPage} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Card className="flex flex-col border-[#24313a] bg-[#111a20] p-4 xl:sticky xl:top-6 xl:h-[calc(100vh-15rem)] xl:min-h-[38rem]">
        <div className="mb-4 border-b border-[#24313a] pb-3">
          <p className="text-sm font-semibold text-white/90">
            {selectedUpdate ? "Update Comments" : "Select an update"}
          </p>
          {selectedUpdate ? (
            <p className="text-xs text-white/55">
              {Number(selectedUpdate.stats?.commentCount ?? comments.length)} comments
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {!selectedUpdate ? (
            <div className="flex min-h-full items-center justify-center rounded-2xl border border-[#2a3943] bg-[#0f171c] p-4 text-center text-sm text-white/65">
              Click an update card to view comments.
            </div>
          ) : commentsLoading ? (
            <div className="flex min-h-full items-center justify-center rounded-2xl border border-[#2a3943] bg-[#0f171c] p-4 text-center text-sm text-white/65">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex min-h-full items-center justify-center rounded-2xl border border-[#2a3943] bg-[#0f171c] p-4 text-center text-sm text-white/65">
              No comments yet.
            </div>
          ) : (
            comments.map((comment) => {
              const commenterName = comment.user?.name || "Unknown";
              const commenterRole = String(comment.user?.role || "")
                .replace("-", " ")
                .toUpperCase();
              const commenterAvatar = comment.user?.avatar?.url;

              return (
                <div key={comment._id} className="flex items-start gap-3">
                  {commenterAvatar ? (
                    <img
                      src={commenterAvatar}
                      alt={commenterName}
                      className="mt-1 h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#2d404b] text-[10px] font-semibold text-white">
                      {getInitials(commenterName)}
                    </div>
                  )}
                  <div className="flex-1 rounded-2xl border border-white/10 bg-[#0f171c] p-3 text-white/90">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold">{commenterName}</p>
                      <p className="text-[10px] text-white/45">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-white/75">
                      {comment.comment || "-"}
                    </p>
                    {commenterRole ? (
                      <p className="mt-2 text-[10px] tracking-[0.18em] text-white/45">
                        {commenterRole}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-[#24313a] pt-4">
          <Input
            ref={commentInputRef}
            id="update-comment-input"
            value={updateCommentText}
            onChange={(event) => onUpdateCommentTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSendComment();
              }
            }}
            placeholder="Write a comment..."
            className="h-12 border-[#2a3a45] bg-[#0e1519] text-white placeholder:text-white/45"
          />
          <Button
            size="icon"
            className="h-12 w-12 bg-[#1b9e72] text-white hover:bg-[#168b64]"
            onClick={onSendComment}
            disabled={!activeUpdateId || isSendingComment || !updateCommentText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectProgress,
  addUpdateComment,
  createProjectUpdate,
  createTask,
  deleteProjectProgress,
  deleteProjectUpdate,
  getChatMessages,
  getDocuments,
  getProjectChat,
  getProjectDetails,
  getProjectUpdates,
  getTasks,
  getUpdateComments,
  sendChatMessage,
  syncProjectAutoProgress,
  toggleUpdateLike,
  updateProjectProgress,
  updateTaskStatus,
  uploadDocument,
  type CommentItem,
  type DocumentItem,
  type Message as ChatMessageItem,
  type ProjectProgressUpdate,
  type Task,
  type UpdateItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocketClient } from "@/lib/socket";
import { toast } from "sonner";
import { ConversationTab } from "./_components/conversation-tab";
import { CreateUpdateDialog } from "./_components/create-update-dialog";
import { DocumentsTab } from "./_components/documents-tab";
import { ProgressTab } from "./_components/progress-tab";
import { ProjectTabs } from "./_components/project-tabs";
import { TaskTab } from "./_components/task-tab";
import type { ActiveTab } from "./_components/types";
import { DOCUMENT_CATEGORY_OPTIONS, ensureArray } from "./_components/utils";
import { UpdatesTab } from "./_components/updates-tab";

const DOCUMENT_FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf";

/**
 * Calculates the auto-timeline percentage from project start/end dates.
 * Formula: ((today - startDate) / (endDate - startDate)) * 100, capped 0–100.
 * This is the ONLY source for the top progress bar — manual entries have no effect.
 */
function calcAutoTimelinePercent(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (end <= start) return 0;
  return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
}

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const projectId = Array.isArray(projectIdParam)
    ? (projectIdParam[0] ?? "")
    : (projectIdParam ?? "");
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("task");
  const [taskModal, setTaskModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [createUpdateModal, setCreateUpdateModal] = useState(false);
  const [newUpdateDescription, setNewUpdateDescription] = useState("");
  const [newUpdateFiles, setNewUpdateFiles] = useState<File[]>([]);
  const [selectedDocumentName, setSelectedDocumentName] = useState("");

  // ── Create progress state ──────────────────────────────────────────────────
  const [createProgressModal, setCreateProgressModal] = useState(false);
  const [createProgressForm, setCreateProgressForm] = useState({
    progressName: "",
    note: "",
  });
  const [createProgressPhoto, setCreateProgressPhoto] = useState<File | null>(null);
  const [createProgressPhotoName, setCreateProgressPhotoName] = useState("");

  // ── Edit progress state (title + note only — percent is not editable) ─────
  const [editingProgress, setEditingProgress] = useState<ProjectProgressUpdate | null>(null);
  const [progressForm, setProgressForm] = useState({
    progressName: "",
    note: "",
  });

  // ── Delete progress state ─────────────────────────────────────────────────
  const [deletingProgress, setDeletingProgress] = useState<ProjectProgressUpdate | null>(null);

  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [deletingUpdate, setDeletingUpdate] = useState<UpdateItem | null>(null);
  const [updateCommentText, setUpdateCommentText] = useState("");
  const [chatText, setChatText] = useState("");
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<Task>(data),
  });

  const updatesQuery = useQuery({
    queryKey: ["updates", projectId],
    queryFn: () => getProjectUpdates(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<UpdateItem>(data),
  });

  const docsQuery = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId),
    enabled: !!projectId,
    select: (data) => ensureArray<DocumentItem>(data),
  });

  const chatQuery = useQuery({
    queryKey: ["chat", projectId],
    queryFn: () => getProjectChat(projectId),
    enabled: !!projectId,
  });

  const chatId = chatQuery.data?._id;

  const messagesQuery = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: !!chatId,
    select: (data) => ensureArray<ChatMessageItem>(data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const syncAutoProgressMutation = useMutation({
    mutationFn: () => syncProjectAutoProgress(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setTaskModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const createUpdateMutation = useMutation({
    mutationFn: createProjectUpdate,
    onSuccess: (response) => {
      toast.success("Project update posted");
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
      setSelectedUpdateId(response.data?._id ?? null);
      setCreateUpdateModal(false);
      setNewUpdateDescription("");
      setNewUpdateFiles([]);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: "not-started" | "in-progress" | "completed";
    }) => updateTaskStatus(taskId, { status }),
    onSuccess: () => {
      toast.success("Task status updated");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  // Create a manual progress milestone (title + note + optional photo).
  // percent is always sent as 0 — it has no effect on the top progress bar.
  const createProgressMutation = useMutation({
    mutationFn: (payload: { progressName: string; note?: string; photo?: File | null }) =>
      addProjectProgress(projectId, payload),
    onSuccess: () => {
      toast.success("Progress entry added");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setCreateProgressModal(false);
      setCreateProgressForm({ progressName: "", note: "" });
      setCreateProgressPhoto(null);
      setCreateProgressPhotoName("");
    },
    onError: (error) => toast.error(error.message),
  });

  // Edit title + note only. The stored percent is passed through unchanged
  // so the backend payload is valid, but the user cannot see or change it.
  const updateProgressMutation = useMutation({
    mutationFn: ({
      progressUpdateId,
      payload,
    }: {
      progressUpdateId: string;
      payload: { progressName: string; percent: number; note?: string };
    }) => updateProjectProgress(projectId, progressUpdateId, payload),
    onSuccess: () => {
      toast.success("Progress updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setEditingProgress(null);
      setProgressForm({ progressName: "", note: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProgressMutation = useMutation({
    mutationFn: (progressUpdateId: string) =>
      deleteProjectProgress(projectId, progressUpdateId),
    onSuccess: () => {
      toast.success("Progress entry deleted");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setDeletingProgress(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const likeMutation = useMutation({
    mutationFn: toggleUpdateLike,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] }),
    onError: (error) => toast.error(error.message),
  });

  const commentMutation = useMutation({
    mutationFn: ({
      updateId,
      comment,
    }: {
      updateId: string;
      comment: string;
    }) => addUpdateComment(updateId, { comment }),
    onSuccess: (_, variables) => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["update-comments", variables.updateId],
      });
      setUpdateCommentText("");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: deleteProjectUpdate,
    onSuccess: (_, deletedUpdateId) => {
      toast.success("Project update deleted");
      if (activeUpdateId === deletedUpdateId) setSelectedUpdateId(null);
      setDeletingUpdate(null);
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["update-comments", deletedUpdateId],
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      setSelectedDocumentName("");
      setDocModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      const trimmed = String(message || "").trim();
      if (!chatId) throw new Error("Chat is not ready");
      if (!trimmed) throw new Error("Message is required");
      return sendChatMessage(chatId, { message: trimmed });
    },
    onSuccess: () => {
      setChatText("");
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (error) => toast.error(error.message),
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];
  const updates = updatesQuery.data ?? [];
  const activeUpdateId =
    selectedUpdateId && updates.some((update) => update._id === selectedUpdateId)
      ? selectedUpdateId
      : (updates[0]?._id ?? null);

  const commentsQuery = useQuery({
    queryKey: ["update-comments", activeUpdateId],
    queryFn: () => getUpdateComments(activeUpdateId!),
    enabled: !!activeUpdateId,
    select: (data) => ensureArray<CommentItem>(data),
  });

  const comments = commentsQuery.data ?? [];
  const documents = docsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const selectedUpdate =
    updates.find((update) => update._id === activeUpdateId) ?? null;

  const progressUpdates = useMemo(
    () =>
      ensureArray<ProjectProgressUpdate>(project?.progressUpdates)
        .slice()
        .sort(
          (left, right) =>
            new Date(right?.updatedAt || 0).getTime() -
            new Date(left?.updatedAt || 0).getTime(),
        ),
    [project?.progressUpdates],
  );

  // Auto-timeline %: derived solely from start/end dates — never from manual entries.
  const autoTimelinePercent = useMemo(
    () => calcAutoTimelinePercent(project?.startDate, project?.endDate),
    [project?.startDate, project?.endDate],
  );

  const loading = projectQuery.isLoading;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendMessage = () => {
    const trimmed = chatText.trim();
    if (!trimmed || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(trimmed);
  };

  const handleSendUpdateComment = () => {
    const trimmed = updateCommentText.trim();
    if (!activeUpdateId || !trimmed || commentMutation.isPending) return;
    commentMutation.mutate({ updateId: activeUpdateId, comment: trimmed });
  };

  const openEditProgressModal = (progressUpdate: ProjectProgressUpdate) => {
    setEditingProgress(progressUpdate);
    setProgressForm({
      progressName: progressUpdate.progressName || "",
      note: progressUpdate.note || "",
    });
  };

  const handleProgressUpdateSubmit = () => {
    if (!editingProgress) return;
    const progressName = progressForm.progressName.trim();
    if (!progressName) {
      toast.error("Progress name is required");
      return;
    }
    // Pass existing percent unchanged — it is not user-editable
    updateProgressMutation.mutate({
      progressUpdateId: editingProgress._id,
      payload: {
        progressName,
        percent: editingProgress.percent,
        note: progressForm.note.trim(),
      },
    });
  };

  const handleCreateProgressSubmit = () => {
    const progressName = createProgressForm.progressName.trim();
    if (!progressName) {
      toast.error("Progress name is required");
      return;
    }
    createProgressMutation.mutate({
      progressName,
      note: createProgressForm.note.trim() || undefined,
      photo: createProgressPhoto,
    });
  };

  const resetCreateUpdateForm = () => {
    setCreateUpdateModal(false);
    setNewUpdateDescription("");
    setNewUpdateFiles([]);
  };

  const handleCreateUpdateSubmit = () => {
    const description = newUpdateDescription.trim();
    if (!description) {
      toast.error("Description is required");
      return;
    }
    const payload = new FormData();
    payload.append("projectId", projectId);
    payload.append("description", description);
    newUpdateFiles.forEach((file) => payload.append("media", file));
    createUpdateMutation.mutate(payload);
  };

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    const socket = getSocketClient();
    if (!socket.connected) socket.connect();

    socket.emit("joinProjectRoom", projectId);
    if (chatId) socket.emit("joinChatRoom", chatId);

    const refreshUpdates = () => {
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
    };
    const refreshSelectedUpdateComments = (payload?: { updateId?: string }) => {
      if (!activeUpdateId) return;
      if (payload?.updateId && payload.updateId !== activeUpdateId) return;
      queryClient.invalidateQueries({ queryKey: ["update-comments", activeUpdateId] });
    };
    const refreshDocuments = () => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    };
    const refreshMessages = (payload?: { chatId?: string }) => {
      if (payload?.chatId && chatId && payload.chatId !== chatId) return;
      if (chatId) queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    };
    const handleChatMessage = (
      incoming: ChatMessageItem & {
        chatRoom?: string | { _id?: string };
        chatId?: string;
      },
    ) => {
      if (!chatId) return;
      const incomingChatId =
        typeof incoming.chatRoom === "string"
          ? incoming.chatRoom
          : (incoming.chatRoom?._id ?? incoming.chatId);
      if (incomingChatId && incomingChatId !== chatId) return;
      queryClient.setQueryData(["messages", chatId], (current: unknown) => {
        const currentItems = ensureArray<ChatMessageItem>(current);
        if (currentItems.some((item) => item._id === incoming._id)) return currentItems;
        return [...currentItems, incoming];
      });
    };

    socket.on("project:updateCreated", refreshUpdates);
    socket.on("project:updateLiked", refreshUpdates);
    socket.on("project:updateCommented", refreshUpdates);
    socket.on("project:updateCommented", refreshSelectedUpdateComments);
    socket.on("project:documentUploaded", refreshDocuments);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:read", refreshMessages);

    return () => {
      socket.off("project:updateCreated", refreshUpdates);
      socket.off("project:updateLiked", refreshUpdates);
      socket.off("project:updateCommented", refreshUpdates);
      socket.off("project:updateCommented", refreshSelectedUpdateComments);
      socket.off("project:documentUploaded", refreshDocuments);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:read", refreshMessages);
    };
  }, [projectId, chatId, queryClient, activeUpdateId]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <Card className="p-4">
        <p className="text-body-16 text-white/80">
          Unable to resolve project id from URL.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="text-heading-40 inline-flex items-center gap-2"
      >
        <ChevronLeft className="h-6 w-6" /> View Details
      </Link>
      <p className="text-body-16 text-white/80">Create and manage your projects</p>

      {/* Auto-timeline progress bar — driven by project dates, never by manual entries */}
      {project ? (
        <Card className="max-w-md p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-body-16">Overall Progress</p>
            <span className="text-sm font-semibold text-[#e8d38b]">
              {autoTimelinePercent}%
            </span>
          </div>
          <ProgressBar value={autoTimelinePercent} />
          <p className="mt-2 text-xs text-white/70">
            Auto-calculated from project start and estimated handover date.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "updates" ? (
          <Button className="ml-auto" onClick={() => setCreateUpdateModal(true)}>
            Post
          </Button>
        ) : null}

        {/* Add Progress button — only visible on the Progress tab */}
        {activeTab === "progress" ? (
          <Button className="ml-auto" onClick={() => setCreateProgressModal(true)}>
            Add Progress
          </Button>
        ) : null}
      </div>

      {activeTab === "task" ? (
        <TaskTab
          tasks={tasks}
          onCreateTask={() => setTaskModal(true)}
          onStatusChange={(taskId, status) =>
            updateTaskStatusMutation.mutate({ taskId, status })
          }
        />
      ) : null}

      {activeTab === "updates" ? (
        <UpdatesTab
          updates={updates}
          activeUpdateId={activeUpdateId}
          selectedUpdate={selectedUpdate}
          comments={comments}
          commentsLoading={commentsQuery.isLoading}
          updateCommentText={updateCommentText}
          commentInputRef={commentInputRef}
          isSendingComment={commentMutation.isPending}
          onUpdateCommentTextChange={setUpdateCommentText}
          onSelectUpdate={setSelectedUpdateId}
          onLike={(updateId) => likeMutation.mutate(updateId)}
          onDeleteUpdate={setDeletingUpdate}
          onSendComment={handleSendUpdateComment}
        />
      ) : null}

      {activeTab === "documents" ? (
        <DocumentsTab
          documents={documents}
          onUploadDocument={() => setDocModal(true)}
        />
      ) : null}

      {activeTab === "progress" ? (
        <ProgressTab
          progressUpdates={progressUpdates}
          onEditProgress={openEditProgressModal}
          onDeleteProgress={setDeletingProgress}
        />
      ) : null}

      {activeTab === "conversation" ? (
        <ConversationTab
          messages={messages}
          chatText={chatText}
          onChatTextChange={setChatText}
          onSendMessage={handleSendMessage}
        />
      ) : null}

      {/* ── Create Task modal ─────────────────────────────────────────────── */}
      <Dialog open={taskModal} onOpenChange={setTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task for this project.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            action={(formData) =>
              createTaskMutation.mutate({
                projectId,
                taskName: String(formData.get("taskName") || ""),
                taskDate: String(formData.get("taskDate") || ""),
                dueDate: String(formData.get("taskDate") || ""),
                priority: String(formData.get("priority") || "medium") as
                  | "high"
                  | "medium"
                  | "low",
                description: String(formData.get("description") || ""),
              })
            }
          >
            <div>
              <Label>Task name</Label>
              <Input name="taskName" placeholder="task" required />
            </div>
            <div>
              <Label>Task Date</Label>
              <Input name="taskDate" type="date" required />
            </div>
            <div>
              <Label>Priority</Label>
              <Select name="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
            <div>
              <Label>Task Description</Label>
              <Textarea
                name="description"
                placeholder="task description......"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskModal(false)}
              >
                Cancel
              </Button>
              <Button disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Upload Document modal ─────────────────────────────────────────── */}
      <Dialog
        open={docModal}
        onOpenChange={(nextOpen) => {
          setDocModal(nextOpen);
          if (!nextOpen) setSelectedDocumentName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new project document for the client and team.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            action={(formData) => {
              formData.append("projectId", projectId);
              uploadDocumentMutation.mutate(formData);
            }}
          >
            <div>
              <Label>Select Category</Label>
              <Select name="category" required>
                {DOCUMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                  <option key={categoryOption.value} value={categoryOption.value}>
                    {categoryOption.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="Document title" required />
            </div>
            <div className="rounded-lg border border-dashed border-white/50 p-8 text-center">
              <Label htmlFor="document" className="cursor-pointer text-body-16">
                Upload File
                <p className="text-body-16 text-white/70">
                  png, jpg, jpeg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv
                </p>
                {selectedDocumentName ? (
                  <p className="mt-2 truncate text-xs text-white">
                    Selected: {selectedDocumentName}
                  </p>
                ) : null}
              </Label>
              <Input
                id="document"
                name="document"
                type="file"
                accept={DOCUMENT_FILE_ACCEPT}
                className="hidden"
                onChange={(event) =>
                  setSelectedDocumentName(event.target.files?.[0]?.name || "")
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDocModal(false)}
              >
                Cancel
              </Button>
              <Button disabled={uploadDocumentMutation.isPending}>
                {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Update confirmation ────────────────────────────────────── */}
      <Dialog
        open={Boolean(deletingUpdate)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteUpdateMutation.isPending) setDeletingUpdate(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project update?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingUpdate(null)}
              disabled={deleteUpdateMutation.isPending}
            >
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deletingUpdate?._id) deleteUpdateMutation.mutate(deletingUpdate._id);
              }}
              disabled={deleteUpdateMutation.isPending}
            >
              {deleteUpdateMutation.isPending ? "Deleting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Update dialog ──────────────────────────────────────────── */}
      <CreateUpdateDialog
        open={createUpdateModal}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !createUpdateMutation.isPending) {
            resetCreateUpdateForm();
          } else {
            setCreateUpdateModal(nextOpen);
          }
        }}
        description={newUpdateDescription}
        selectedFiles={newUpdateFiles}
        isSubmitting={createUpdateMutation.isPending}
        onDescriptionChange={setNewUpdateDescription}
        onFilesChange={(files) =>
          setNewUpdateFiles((current) => {
            const merged = [...current, ...files];
            return merged.filter(
              (file, index, list) =>
                list.findIndex(
                  (candidate) =>
                    candidate.name === file.name &&
                    candidate.size === file.size &&
                    candidate.lastModified === file.lastModified,
                ) === index,
            );
          })
        }
        onRemoveFile={(index) =>
          setNewUpdateFiles((current) => current.filter((_, i) => i !== index))
        }
        onSubmit={handleCreateUpdateSubmit}
        onCancel={resetCreateUpdateForm}
      />

      {/* ── Add Progress modal ────────────────────────────────────────────── */}
      <Dialog
        open={createProgressModal}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !createProgressMutation.isPending) {
            setCreateProgressModal(false);
            setCreateProgressForm({ progressName: "", note: "" });
            setCreateProgressPhoto(null);
            setCreateProgressPhotoName("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
            <DialogDescription>
              Record a milestone or progress update for this project.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateProgressSubmit();
            }}
          >
            <div>
              <Label htmlFor="create-progress-name">Title</Label>
              <Input
                id="create-progress-name"
                value={createProgressForm.progressName}
                onChange={(event) =>
                  setCreateProgressForm((current) => ({
                    ...current,
                    progressName: event.target.value,
                  }))
                }
                placeholder="e.g. Foundations completed"
                required
              />
            </div>

            <div>
              <Label htmlFor="create-progress-note">Note (optional)</Label>
              <Textarea
                id="create-progress-note"
                value={createProgressForm.note}
                onChange={(event) =>
                  setCreateProgressForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Any additional details about this milestone"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="create-progress-photo">Photo (optional)</Label>
              <div className="mt-1 rounded-lg border border-dashed border-white/30 p-5 text-center">
                <Label
                  htmlFor="create-progress-photo"
                  className="cursor-pointer text-sm text-white/70"
                >
                  {createProgressPhotoName ? (
                    <span className="text-white">Selected: {createProgressPhotoName}</span>
                  ) : (
                    "Click to attach a photo"
                  )}
                </Label>
                <Input
                  id="create-progress-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setCreateProgressPhoto(file);
                    setCreateProgressPhotoName(file?.name ?? "");
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateProgressModal(false);
                  setCreateProgressForm({ progressName: "", note: "" });
                  setCreateProgressPhoto(null);
                  setCreateProgressPhotoName("");
                }}
                disabled={createProgressMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProgressMutation.isPending}>
                {createProgressMutation.isPending ? "Adding..." : "Add Progress"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Progress modal (title + note only) ───────────────────────── */}
      <Dialog
        open={Boolean(editingProgress)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !updateProgressMutation.isPending) {
            setEditingProgress(null);
            setProgressForm({ progressName: "", note: "" });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Progress Update</DialogTitle>
            <DialogDescription>
              Update the title or note for this progress entry.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleProgressUpdateSubmit();
            }}
          >
            <div>
              <Label htmlFor="progress-name">Title</Label>
              <Input
                id="progress-name"
                value={progressForm.progressName}
                onChange={(event) =>
                  setProgressForm((current) => ({
                    ...current,
                    progressName: event.target.value,
                  }))
                }
                placeholder="Progress title"
                required
              />
            </div>

            <div>
              <Label htmlFor="progress-note">Note</Label>
              <Textarea
                id="progress-note"
                value={progressForm.note}
                onChange={(event) =>
                  setProgressForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Describe the current progress"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProgress(null);
                  setProgressForm({ progressName: "", note: "" });
                }}
                disabled={updateProgressMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateProgressMutation.isPending}>
                {updateProgressMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Progress confirmation ──────────────────────────────────── */}
      <Dialog
        open={Boolean(deletingProgress)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteProgressMutation.isPending) setDeletingProgress(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Progress Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;
              {deletingProgress?.progressName}&rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingProgress(null)}
              disabled={deleteProgressMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deletingProgress?._id) {
                  deleteProgressMutation.mutate(deletingProgress._id);
                }
              }}
              disabled={deleteProgressMutation.isPending}
            >
              {deleteProgressMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

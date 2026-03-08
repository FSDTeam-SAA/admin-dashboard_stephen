"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Download,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectPhase,
  addProjectProgress,
  addUpdateComment,
  createProjectUpdate,
  createTask,
  getChatMessages,
  getDocuments,
  getProjectChat,
  getProjectDetails,
  getProjectUpdates,
  getTasks,
  sendChatMessage,
  toggleUpdateLike,
  updatePhasePaymentStatus,
  updateTaskStatus,
  uploadDocument,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ActiveTab = "task" | "updates" | "documents" | "phase" | "conversation";

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("task");
  const [taskModal, setTaskModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [addPhaseModal, setAddPhaseModal] = useState(false);
  const [phaseModal, setPhaseModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [chatText, setChatText] = useState("");
  const [progressValue, setProgressValue] = useState("");
  const [progressEdit, setProgressEdit] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDueDate, setNewPhaseDueDate] = useState("");
  const [newPhaseAmount, setNewPhaseAmount] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [phaseStatus, setPhaseStatus] = useState<"paid" | "unpaid">("paid");

  function resetNewPhaseForm() {
    setNewPhaseName("");
    setNewPhaseDueDate("");
    setNewPhaseAmount("");
  }

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getTasks(projectId),
    enabled: !!projectId,
  });

  const updatesQuery = useQuery({
    queryKey: ["updates", projectId],
    queryFn: () => getProjectUpdates(projectId),
    enabled: !!projectId,
  });

  const docsQuery = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getDocuments(projectId),
    enabled: !!projectId,
  });

  const chatQuery = useQuery({
    queryKey: ["chat", projectId],
    queryFn: () => getProjectChat(projectId),
    enabled: !!projectId,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", chatQuery.data?._id],
    queryFn: () => getChatMessages(chatQuery.data!._id),
    enabled: !!chatQuery.data?._id,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (payload: { progressName: string; percent: number; note?: string }) =>
      addProjectProgress(projectId, payload),
    onSuccess: () => {
      toast.success("Progress updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProgressEdit(false);
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

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: "not-started" | "in-progress" | "completed" }) =>
      updateTaskStatus(taskId, { status }),
    onSuccess: () => {
      toast.success("Task status updated");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const createUpdateMutation = useMutation({
    mutationFn: createProjectUpdate,
    onSuccess: () => {
      toast.success("Update posted");
      setUpdateText("");
      queryClient.invalidateQueries({ queryKey: ["updates", projectId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const likeMutation = useMutation({
    mutationFn: toggleUpdateLike,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["updates", projectId] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ updateId, comment }: { updateId: string; comment: string }) => addUpdateComment(updateId, { comment }),
    onSuccess: () => {
      toast.success("Comment added");
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      setDocModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const createPhaseMutation = useMutation({
    mutationFn: (payload: { phaseName: string; amount: number; dueDate: string }) =>
      addProjectPhase(projectId, payload),
    onSuccess: () => {
      toast.success("Phase created");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      resetNewPhaseForm();
      setAddPhaseModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const phaseMutation = useMutation({
    mutationFn: () => updatePhasePaymentStatus(projectId, { phaseName, paymentStatus: phaseStatus }),
    onSuccess: () => {
      toast.success("Phase updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      setPhaseModal(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(chatQuery.data!._id, { message }),
    onSuccess: () => {
      setChatText("");
      queryClient.invalidateQueries({ queryKey: ["messages", chatQuery.data?._id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];
  const updates = updatesQuery.data ?? [];
  const documents = docsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];

  const loading = projectQuery.isLoading;
  const lastProgress = useMemo(() => project?.progress ?? 0, [project?.progress]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/projects" className="text-heading-40 inline-flex items-center gap-2">
        <ChevronLeft className="h-6 w-6" /> View Details
      </Link>
      <p className="text-body-16 text-white/80">Create and manage your projects</p>

      <Card className="max-w-md p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-body-16">Progress</p>
          <Button size="sm" onClick={() => setProgressEdit((prev) => !prev)}>
            {progressEdit ? "Close" : "Update"}
          </Button>
        </div>
        <ProgressBar value={lastProgress} />
        {progressEdit ? (
          <div className="mt-3 flex items-center gap-2">
            <Input value={progressValue} onChange={(e) => setProgressValue(e.target.value)} placeholder="80" className="h-10" />
            <Button
              size="sm"
              onClick={() =>
                updateProgressMutation.mutate({
                  progressName: "Manual Update",
                  percent: Number(progressValue),
                })
              }
            >
              Save
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-3">
        {([
          ["task", "Task"],
          ["updates", "Updates"],
          ["documents", "Documents"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`text-title-24 rounded-md border px-4 py-2 ${activeTab === key ? "bg-[#8a732e]" : "bg-black"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "task" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTaskModal(true)}>
              <Plus className="mr-2 h-5 w-5" /> Add New Task
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-title-24">{task.taskName}</p>
                  <p className="text-body-16 text-white/80">{task.description}</p>
                  <p className="text-body-16 text-white/70">Date: {formatDate(task.taskDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      task.status === "completed"
                        ? "bg-[#c4ffe0] text-[#0f944f]"
                        : task.status === "in-progress"
                        ? "bg-[#d8ecff] text-[#2b56df]"
                        : "bg-[#e8f0ff] text-[#2c58d8]"
                    }
                  >
                    {task.status}
                  </Badge>
                  <Select
                    value={task.status}
                    onChange={(e) =>
                      updateTaskStatusMutation.mutate({
                        taskId: task._id,
                        status: e.target.value as "not-started" | "in-progress" | "completed",
                      })
                    }
                    className="h-10"
                  >
                    <option value="not-started">not-started</option>
                    <option value="in-progress">in-progress</option>
                    <option value="completed">completed</option>
                  </Select>
                  <button className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "updates" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-3">
            <Card className="p-3">
              <Textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Write project update"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("projectId", projectId);
                    formData.append("description", updateText);
                    createUpdateMutation.mutate(formData);
                  }}
                >
                  Post Update
                </Button>
              </div>
            </Card>

            {updates.map((update) => (
              <Card key={update._id} className="p-4">
                <p className="text-body-16 leading-relaxed">{update.description}</p>
                <div className="text-body-16 mt-3 flex items-center gap-4 text-white/80">
                  <button onClick={() => likeMutation.mutate(update._id)}>{update.stats.likeCount} Like</button>
                  <span>{update.stats.commentCount} Comments</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Add comment" className="h-10" id={`comment-${update._id}`} />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(`comment-${update._id}`) as HTMLInputElement | null;
                      const value = input?.value || "";
                      if (!value) return;
                      commentMutation.mutate({ updateId: update._id, comment: value });
                      if (input) input.value = "";
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <div className="space-y-3">
              {messages.map((item) => (
                <div key={item._id} className="rounded-xl bg-white/90 p-3 text-[#111]">
                  <p className="text-body-16 font-semibold">{item.sender?.name}</p>
                  <p className="text-body-16 text-black/70">{item.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Start typing..." className="h-11" />
              <Button size="icon" onClick={() => sendMessageMutation.mutate(chatText)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDocModal(true)}>
              <Plus className="mr-2 h-5 w-5" /> Upload Documents
            </Button>
          </div>

          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc._id} className="flex items-center justify-between bg-white p-3 text-black">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-5 w-5 text-[#8a732e]" />
                  <div>
                    <p className="text-body-16 font-medium">{doc.title}</p>
                    <p className="text-body-16 text-black/70">
                      {doc.category} • {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <a href={doc.document.url} target="_blank" rel="noreferrer" className="text-[#8a732e]">
                  <Download className="h-5 w-5" />
                </a>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "conversation" ? (
        <Card className="border-[#7f6a2c] p-4">
          <h3 className="text-title-24">Approve updated bathroom tile layout for ensuite</h3>
          <p className="text-body-16 mb-5 mt-2 text-white/70">Please review the herringbone pattern transition and the grout color selection</p>

          <div className="space-y-4">
            {messages.map((item) => (
              <div key={item._id}>
                <p className="text-body-16 font-semibold text-white/80">{item.sender?.name}</p>
                <p className="text-body-16 text-white">{item.message}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Write a Comment..." className="h-12" />
            <Button className="h-12 px-6" onClick={() => sendMessageMutation.mutate(chatText)}>
              Send
            </Button>
          </div>
        </Card>
      ) : null}

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Create New Task">
        <form
          className="space-y-4"
          action={(formData) =>
            createTaskMutation.mutate({
              projectId,
              taskName: String(formData.get("taskName") || ""),
              taskDate: String(formData.get("taskDate") || ""),
              dueDate: String(formData.get("taskDate") || ""),
              priority: String(formData.get("priority") || "medium") as "high" | "medium" | "low",
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
            <Textarea name="description" placeholder="task description......" required />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setTaskModal(false)}>
              Cancel
            </Button>
            <Button disabled={createTaskMutation.isPending}>{createTaskMutation.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={docModal} onClose={() => setDocModal(false)} title="Upload Document">
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
              <option value="Drawings">Drawings</option>
              <option value="Invoice">Invoice</option>
              <option value="Reports">Reports</option>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input name="title" placeholder="Document title" required />
          </div>
          <div className="rounded-lg border border-dashed border-white/50 p-8 text-center">
            <Label htmlFor="document" className="cursor-pointer text-body-16">
              Upload Photo
              <p className="text-body-16 text-white/70">png,jpeg,jpg</p>
            </Label>
            <Input id="document" name="document" type="file" className="hidden" required />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setDocModal(false)}>
              Cancel
            </Button>
            <Button disabled={uploadDocumentMutation.isPending}>{uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


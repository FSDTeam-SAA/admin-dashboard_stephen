"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit2, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getManagers,
  getProjects,
  updateProject,
  type Project,
} from "@/lib/api";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import {
  calculateProjectBudget,
  parseAmountInput,
  toDateInputValue,
} from "@/lib/project-form";
import UpdateProjectModal, {
  type EditablePhase,
} from "./_components/Update_project";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { formatCurrency, formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 9;

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState<string>(PROJECT_CATEGORIES[0].value);
  const [siteManagerId, setSiteManagerId] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phases, setPhases] = useState<EditablePhase[]>([
    { phaseName: "", amount: "", dueDate: "" },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => getProjects(search || undefined),
  });
  const { data: managers } = useQuery({
    queryKey: ["managers-list"],
    queryFn: getManagers,
  });

  const paged = useMemo(
    () => paginate(data ?? [], page, PAGE_SIZE),
    [data, page],
  );
  const totalProjectBudget = useMemo(
    () => calculateProjectBudget(phases),
    [phases],
  );

  const updateProjectMutation = useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: {
        clientName: string;
        projectName: string;
        category: string;
        phases: Array<{ phaseName: string; amount: number; dueDate: string }>;
        startDate: string;
        endDate: string;
        address: string;
        siteManagerId: string;
      };
    }) => updateProject(projectId, payload),
    onSuccess: (_response, variables) => {
      toast.success("Project updated successfully");
      closeEditModal();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function openEditModal(project: Project) {
    setEditingProject(project);
    setClientName(project.clientName ?? "");
    setProjectName(project.projectName ?? "");
    setCategory(project.category ?? PROJECT_CATEGORIES[0].value);
    setSiteManagerId(project.siteManager?._id ?? "");
    setAddress(project.address ?? "");
    setStartDate(toDateInputValue(project.startDate));
    setEndDate(toDateInputValue(project.endDate));
    setPhases(
      project.phases?.length
        ? project.phases.map((phase) => ({
            phaseName: phase.phaseName ?? "",
            amount: String(phase.amount ?? ""),
            dueDate: toDateInputValue(phase.dueDate),
          }))
        : [{ phaseName: "", amount: "", dueDate: "" }],
    );
  }

  function closeEditModal() {
    setEditingProject(null);
    setPhases([{ phaseName: "", amount: "", dueDate: "" }]);
  }

  function handlePhaseChange(
    index: number,
    field: keyof EditablePhase,
    value: string,
  ) {
    setPhases((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function handleAddPhase() {
    setPhases((prev) => [...prev, { phaseName: "", amount: "", dueDate: "" }]);
  }

  function handleRemovePhase(index: number) {
    setPhases((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleUpdateProject() {
    if (!editingProject) {
      return;
    }

    const missingFields = [
      !clientName.trim() ? "Client Name" : null,
      !projectName.trim() ? "Projects Name" : null,
      !category.trim() ? "Projects Categories" : null,
      !startDate ? "Projects Start Date" : null,
      !endDate ? "Projects End Date" : null,
      !address.trim() ? "Address" : null,
      !siteManagerId ? "Site Manager" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    const hasIncompletePhase = phases.some((phase) =>
      phase.phaseName.trim() || phase.amount.trim() || phase.dueDate
        ? !(phase.phaseName.trim() && phase.amount.trim() && phase.dueDate)
        : false,
    );

    if (hasIncompletePhase) {
      toast.error("Complete or remove each phase before updating the project");
      return;
    }

    const normalizedPhases = phases
      .filter(
        (phase) => phase.phaseName.trim() && phase.amount.trim() && phase.dueDate,
      )
      .map((phase) => ({
        phaseName: phase.phaseName.trim(),
        amount: parseAmountInput(phase.amount),
        dueDate: phase.dueDate,
      }));

    if (normalizedPhases.length === 0) {
      toast.error("Add at least one phase to the project");
      return;
    }

    const phaseNames = normalizedPhases.map((phase) =>
      phase.phaseName.toLowerCase(),
    );
    if (new Set(phaseNames).size !== phaseNames.length) {
      toast.error("Phase names must be unique within a project");
      return;
    }

    if (
      normalizedPhases.some(
        (phase) => Number.isNaN(phase.amount) || phase.amount < 0,
      )
    ) {
      toast.error("Phase amount must be a valid number");
      return;
    }

    updateProjectMutation.mutate({
      projectId: editingProject._id,
      payload: {
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        category,
        phases: normalizedPhases,
        startDate,
        endDate,
        address: address.trim(),
        siteManagerId,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-heading-40">Projects</h2>
          <p className="text-body-16 mt-1 text-white/80">
            Create and manage your projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="h-12">
            <Plus className="mr-2 h-5 w-5" /> Add New Project
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name"
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="text-body-16 font-semibold text-white">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Projects Name</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Total Paid Amount</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((project) => (
                  <tr
                    key={project._id}
                    className="text-body-16 border-t border-white/10 text-white/90"
                  >
                    <td className="px-6 py-5">{project.clientName}</td>
                    <td className="px-6 py-5">{project.projectName}</td>
                    <td className="px-6 py-5">
                      {formatCurrency(project.projectBudget)}
                    </td>
                    <td className="px-6 py-5">
                      {formatCurrency(project.totalPaid)}
                    </td>
                    <td className="px-6 py-5">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="px-6 py-5">{formatDate(project.endDate)}</td>
                    <td className="px-6 py-5 min-w-[220px]">
                      <ProgressBar value={project.progress} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Link href={`/projects/${project._id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
                          aria-label={`Edit ${project.projectName}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-body-16 text-white/85">
          Showing {paged.total === 0 ? 0 : (paged.page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(paged.page * PAGE_SIZE, paged.total)} of {paged.total}{" "}
          results
        </p>
        <PaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          onChange={setPage}
        />
      </div>

      <UpdateProjectModal
        open={Boolean(editingProject)}
        onClose={closeEditModal}
        onSubmit={(event) => {
          event.preventDefault();
          handleUpdateProject();
        }}
        clientName={clientName}
        onClientNameChange={setClientName}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        category={category}
        onCategoryChange={setCategory}
        siteManagerId={siteManagerId}
        onSiteManagerIdChange={setSiteManagerId}
        managers={managers?.map((manager) => ({
          _id: manager._id,
          name: manager.name,
        }))}
        phases={phases}
        onPhaseChange={handlePhaseChange}
        onAddPhase={handleAddPhase}
        onRemovePhase={handleRemovePhase}
        totalProjectBudget={totalProjectBudget}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        address={address}
        onAddressChange={setAddress}
        isPending={updateProjectMutation.isPending}
      />
    </div>
  );
}

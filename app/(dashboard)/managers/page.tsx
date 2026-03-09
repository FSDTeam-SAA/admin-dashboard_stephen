"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2 } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteManager,
  getAdminProjects,
  getManagers,
  type User,
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
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { formatCurrency, formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 9;

export default function ManagersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [managerToDelete, setManagerToDelete] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["managers"],
    queryFn: getManagers,
  });

  const {
    data: managerProjects = [],
    isLoading: isManagerProjectsLoading,
    error: managerProjectsError,
  } = useQuery({
    queryKey: ["manager-projects", selectedManager?._id],
    queryFn: () => getAdminProjects({ manager: selectedManager?._id ?? "" }),
    enabled: Boolean(selectedManager?._id),
  });

  const deleteManagerMutation = useMutation({
    mutationFn: deleteManager,
    onSuccess: (_response, managerId) => {
      toast.success("Manager deleted successfully");
      setManagerToDelete(null);

      if (selectedManager?._id === managerId) {
        setSelectedManager(null);
      }

      queryClient.invalidateQueries({ queryKey: ["managers"] });
      queryClient.invalidateQueries({ queryKey: ["managers-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["manager-projects", managerId] });
    },
    onError: (error) => toast.error(error.message),
  });

  const filtered = useMemo(
    () =>
      (data ?? []).filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );
  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  const managerProjectsErrorMessage =
    managerProjectsError instanceof Error
      ? managerProjectsError.message
      : "Failed to load projects";

  function closeProjectsModal() {
    setSelectedManager(null);
  }

  function closeDeleteModal() {
    if (deleteManagerMutation.isPending) {
      return;
    }

    setManagerToDelete(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-40">Mange Manager&apos;s</h2>
        <p className="text-body-16 text-white/80">
          Create and manage your Mange Manager&apos;s
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full">
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
        <Link href="/managers/new">
          <Button className="h-12 whitespace-nowrap">
            <Plus className="mr-1 h-5 w-5" /> Add New Manger
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-body-16 text-left font-semibold">
                  <th className="px-5 py-4">Manger&apos;s Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Designation</th>
                  <th className="px-5 py-4">Assign Of Projects</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((manager) => (
                  <tr
                    key={manager._id}
                    className="text-body-16 border-t border-white/10"
                  >
                    <td className="px-5 py-4">{manager.name}</td>
                    <td className="px-5 py-4">{manager.email}</td>
                    <td className="px-5 py-4">Site Manager</td>
                    <td className="px-5 py-4">
                      {manager.assignedProjects?.length ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedManager(manager)}
                          className="text-white"
                          aria-label={`View projects for ${manager.name}`}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagerToDelete(manager)}
                          className="text-red-400"
                          aria-label={`Delete ${manager.name}`}
                        >
                          <Trash2 className="h-5 w-5" />
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
          {Math.min(paged.page * PAGE_SIZE, paged.total)} of {paged.total} results
        </p>
        <PaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          onChange={setPage}
        />
      </div>

      <Dialog
        open={Boolean(selectedManager)}
        onOpenChange={(open) => {
          if (!open) {
            closeProjectsModal();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-6xl sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
            <DialogDescription>
              {selectedManager?.name
                ? `Assigned projects for ${selectedManager.name}`
                : "Assigned projects"}
            </DialogDescription>
          </DialogHeader>

          <div className="app-scrollbar max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            {isManagerProjectsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            ) : managerProjectsError ? (
              <p className="text-body-16 text-red-300">{managerProjectsErrorMessage}</p>
            ) : managerProjects.length === 0 ? (
              <p className="text-body-16 text-white/70">
                No projects found for this manager.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="text-body-16 font-semibold text-white">
                    <tr>
                      <th className="px-4 py-4">Client Name</th>
                      <th className="px-4 py-4">Projects Name</th>
                      <th className="px-4 py-4">Budget</th>
                      <th className="px-4 py-4">Total Paid Amount</th>
                      <th className="px-4 py-4">Start Date</th>
                      <th className="px-4 py-4">Deadline</th>
                      <th className="px-4 py-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerProjects.map((project) => (
                      <tr
                        key={project._id}
                        className="text-body-16 border-t border-white/10 text-white/90"
                      >
                        <td className="px-4 py-5">{project.clientName}</td>
                        <td className="px-4 py-5">
                          <div>
                            <p>{project.projectName}</p>
                            <p className="mt-1 text-sm text-white/55">
                              {project.address}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          {formatCurrency(project.projectBudget)}
                        </td>
                        <td className="px-4 py-5">
                          {formatCurrency(project.totalPaid)}
                        </td>
                        <td className="px-4 py-5">{formatDate(project.startDate)}</td>
                        <td className="px-4 py-5">{formatDate(project.endDate)}</td>
                        <td className="min-w-[220px] px-4 py-5">
                          <ProgressBar value={project.progress} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(managerToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteModal();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Manager</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {managerToDelete?.name ?? "this manager"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteManagerMutation.isPending}
            >
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                managerToDelete &&
                deleteManagerMutation.mutate(managerToDelete._id)
              }
              disabled={deleteManagerMutation.isPending}
            >
              {deleteManagerMutation.isPending ? "Deleting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

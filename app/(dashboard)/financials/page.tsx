"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFinancialOverview, updatePhasePaymentStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { formatCurrency, formatDate, paginate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 9;

export default function FinancialsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["financials"],
    queryFn: getFinancialOverview,
  });

  const mutation = useMutation({
    mutationFn: ({ projectId, phaseName, paymentStatus }: { projectId: string; phaseName: string; paymentStatus: "paid" | "unpaid" }) =>
      updatePhasePaymentStatus(projectId, { phaseName, paymentStatus }),
    onSuccess: () => {
      toast.success("Paid amount updated");
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = useMemo(
    () => (data?.projects ?? []).filter((project) => project.projectName.toLowerCase().includes(search.toLowerCase())),
    [data?.projects, search],
  );

  const paged = useMemo(() => paginate(rows, page, PAGE_SIZE), [rows, page]);

  const currentProject = (data?.projects ?? []).find((project) => project._id === projectId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-40">Financials</h2>
        <p className="text-body-16 text-white/80">Create and manage your projects Financials.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name"
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="text-body-16 text-left font-semibold">
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
                  <tr key={project._id} className="text-body-16 border-t border-white/10">
                    <td className="px-6 py-5">{project.clientName}</td>
                    <td className="px-6 py-5">{project.projectName}</td>
                    <td className="px-6 py-5">{formatCurrency(project.projectBudget)}</td>
                    <td className="px-6 py-5">{formatCurrency(project.totalPaid)}</td>
                    <td className="px-6 py-5">{formatDate(project.startDate)}</td>
                    <td className="px-6 py-5">{formatDate(project.endDate)}</td>
                    <td className="px-6 py-5 min-w-[220px]">
                      <ProgressBar value={project.progress} />
                    </td>
                    <td className="px-6 py-5">
                      <Button
                        size="sm"
                        onClick={() => {
                          setProjectId(project._id);
                          setPhaseName(project.phases?.[0]?.phaseName ?? "");
                          setOpen(true);
                        }}
                      >
                        Update Paid amount
                      </Button>
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
          Showing {(paged.page - 1) * PAGE_SIZE + 1} to {Math.min(paged.page * PAGE_SIZE, paged.total)} of {paged.total} results
        </p>
        <PaginationBar page={paged.page} totalPages={paged.totalPages} onChange={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Update Paid Amount" className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label>Select Phase</Label>
            <Select value={phaseName} onChange={(e) => setPhaseName(e.target.value)}>
              {(currentProject?.phases ?? []).map((phase) => (
                <option key={phase.phaseName} value={phase.phaseName}>
                  {phase.phaseName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "paid" | "unpaid")}>
              <option value="paid">paid</option>
              <option value="unpaid">unpaid</option>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="h-12" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-12"
              onClick={() => mutation.mutate({ projectId, phaseName, paymentStatus })}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


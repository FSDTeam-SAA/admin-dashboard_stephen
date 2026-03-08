"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, Eye, EyeOff, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createProject, getManagers } from "@/lib/api";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { calculateProjectBudget, parseAmountInput } from "@/lib/project-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

type Phase = {
  phaseName: string;
  amount: string;
  paymentDate: string;
};

export default function AddProjectPage() {
  const router = useRouter();
  const [showClientPassword, setShowClientPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([
    { phaseName: "Deposit", amount: "37000", paymentDate: "" },
  ]);
  const totalProjectBudget = useMemo(
    () => calculateProjectBudget(phases),
    [phases],
  );

  const { data: managers } = useQuery({
    queryKey: ["managers-list"],
    queryFn: getManagers,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project created successfully");
      router.push("/projects");
    },
    onError: (error) => toast.error(error.message),
  });

  async function onSubmit(formData: FormData) {
    const clientName = String(formData.get("clientName") || "").trim();
    const projectName = String(formData.get("projectName") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const startDate = String(formData.get("startDate") || "").trim();
    const endDate = String(formData.get("endDate") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const siteManagerId = String(formData.get("siteManagerId") || "").trim();
    const clientEmail = String(formData.get("clientEmail") || "").trim();
    const clientPassword = String(formData.get("clientPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    const missingFields = [
      !clientName ? "Client Name" : null,
      !projectName ? "Projects Name" : null,
      !category ? "Projects Categories" : null,
      !startDate ? "Projects Start Date" : null,
      !endDate ? "Projects End Date" : null,
      !address ? "Address" : null,
      !siteManagerId ? "Site Manager" : null,
      !clientEmail ? "Enter Email" : null,
      !clientPassword ? "Password" : null,
      !confirmPassword ? "Confirm Password" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (clientPassword !== confirmPassword) {
      toast.error("Password and confirm password must match");
      return;
    }

    const hasIncompletePhase = phases.some(
      (phase) =>
        phase.phaseName.trim() ||
        phase.amount.trim() ||
        phase.paymentDate
          ? !(phase.phaseName.trim() && phase.amount.trim() && phase.paymentDate)
          : false,
    );

    if (hasIncompletePhase) {
      toast.error("Complete or remove each phase before creating the project");
      return;
    }

    const normalizedPhases = phases
      .filter((phase) => phase.phaseName.trim() && phase.amount.trim() && phase.paymentDate)
      .map((phase) => ({
        phaseName: phase.phaseName.trim(),
        amount: parseAmountInput(phase.amount),
        paymentDate: phase.paymentDate,
      }));

    if (normalizedPhases.length === 0) {
      toast.error("Add at least one phase to the project");
      return;
    }

    const phaseNames = normalizedPhases.map((phase) => phase.phaseName.toLowerCase());
    if (new Set(phaseNames).size !== phaseNames.length) {
      toast.error("Phase names must be unique within a project");
      return;
    }

    if (normalizedPhases.some((phase) => Number.isNaN(phase.amount) || phase.amount < 0)) {
      toast.error("Phase amount must be a valid number");
      return;
    }

    createProjectMutation.mutate({
      clientName,
      clientEmail,
      clientPassword,
      projectName,
      category,
      phases: normalizedPhases,
      projectBudget: totalProjectBudget,
      startDate,
      endDate,
      address,
      siteManagerId,
    });
  }

  return (
    <div className="space-y-5">
      <Link href="/projects" className="text-heading-40 inline-flex items-center gap-2">
        <ChevronLeft className="h-6 w-6" /> Add new Projects
      </Link>
      <p className="text-body-16 text-white/80">Create and manage your projects</p>

      <form action={onSubmit} className="space-y-4">
        <div>
          <Label>Client Name</Label>
          <Input name="clientName" placeholder="Enter Client name" required />
        </div>

        <div>
          <Label>Projects Name</Label>
          <Input name="projectName" placeholder="Enter project name" required />
        </div>

        <div>
          <Label>Projects Categories</Label>
          <Select name="category" required>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        {phases.map((phase, index) => (
          <div key={index} className="rounded-lg border border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-body-16 font-medium text-white">Phase {index + 1}</p>
              {phases.length > 1 ? (
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                  onClick={() => setPhases((prev) => prev.filter((_, idx) => idx !== index))}
                  aria-label={`Remove phase ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Phase Name</Label>
                <Input
                  value={phase.phaseName}
                  onChange={(e) =>
                    setPhases((prev) => prev.map((item, idx) => (idx === index ? { ...item, phaseName: e.target.value } : item)))
                  }
                />
              </div>
              <div>
                <Label>Phase Amount</Label>
                <Input
                  value={phase.amount}
                  onChange={(e) =>
                    setPhases((prev) => prev.map((item, idx) => (idx === index ? { ...item, amount: e.target.value } : item)))
                  }
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={phase.paymentDate}
                  onChange={(e) =>
                    setPhases((prev) => prev.map((item, idx) => (idx === index ? { ...item, paymentDate: e.target.value } : item)))
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded border border-white/40"
          onClick={() => setPhases((prev) => [...prev, { phaseName: "", amount: "", paymentDate: "" }])}
        >
          <Plus className="h-4 w-4" />
        </button>

        <div>
          <Label>Total Projects Budget</Label>
          <Input
            name="projectBudget"
            value={String(totalProjectBudget)}
            readOnly
            className="cursor-not-allowed"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Projects Start Date</Label>
            <Input type="date" name="startDate" required />
          </div>
          <div>
            <Label>Projects End Date</Label>
            <Input type="date" name="endDate" required />
          </div>
        </div>

        <div>
          <Label>Address</Label>
          <Input name="address" placeholder="Project address" required />
        </div>

        <div>
          <Label>Site Manager</Label>
          <Select name="siteManagerId" required>
            <option value="">Select a manager</option>
            {(managers ?? []).map((manager) => (
              <option key={manager._id} value={manager._id}>
                {manager.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Enter Email</Label>
          <Input type="email" name="clientEmail" placeholder="Enter Email" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showClientPassword ? "text" : "password"}
                name="clientPassword"
                placeholder="********"
                className="pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-white/70"
                onClick={() => setShowClientPassword((prev) => !prev)}
                aria-label={showClientPassword ? "Hide password" : "Show password"}
              >
                {showClientPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="********"
                className="pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-white/70"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pt-2 md:grid-cols-2">
          <Link href="/projects">
            <Button type="button" variant="outline" className="h-12 w-full">
              Cancel
            </Button>
          </Link>
          <Button className="h-12" disabled={createProjectMutation.isPending}>
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}

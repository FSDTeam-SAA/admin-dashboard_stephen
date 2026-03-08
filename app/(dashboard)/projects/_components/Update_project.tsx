"use client";

import type { FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

export type EditablePhase = {
  phaseName: string;
  amount: string;
  dueDate: string;
};

type ManagerOption = {
  _id: string;
  name: string;
};

type UpdateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  siteManagerId: string;
  onSiteManagerIdChange: (value: string) => void;
  managers?: ManagerOption[];
  phases: EditablePhase[];
  onPhaseChange: (
    index: number,
    field: keyof EditablePhase,
    value: string,
  ) => void;
  onAddPhase: () => void;
  onRemovePhase: (index: number) => void;
  totalProjectBudget: number;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  isPending: boolean;
};

export default function UpdateProjectModal({
  open,
  onClose,
  onSubmit,
  clientName,
  onClientNameChange,
  projectName,
  onProjectNameChange,
  category,
  onCategoryChange,
  siteManagerId,
  onSiteManagerIdChange,
  managers,
  phases,
  onPhaseChange,
  onAddPhase,
  onRemovePhase,
  totalProjectBudget,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  address,
  onAddressChange,
  isPending,
}: UpdateProjectModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Project"
      className="h-[80vh] min-h-[520px] max-h-[80vh] max-w-5xl"
    >
      <form
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={onSubmit}
      >
        <div className="app-scrollbar min-h-0 flex-1 space-y-4 overflow-y-scroll pr-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Client Name</Label>
              <Input
                value={clientName}
                onChange={(event) => onClientNameChange(event.target.value)}
              />
            </div>
            <div>
              <Label>Projects Name</Label>
              <Input
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Projects Categories</Label>
              <Select
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
              >
                {PROJECT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Site Manager</Label>
              <Select
                value={siteManagerId}
                onChange={(event) => onSiteManagerIdChange(event.target.value)}
              >
                <option value="">Select a manager</option>
                {(managers ?? []).map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {phases.map((phase, index) => (
            <div key={index} className="rounded-lg border border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-body-16 font-medium text-white">
                  Phase {index + 1}
                </p>
                {phases.length > 1 ? (
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                    onClick={() => onRemovePhase(index)}
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
                    onChange={(event) =>
                      onPhaseChange(index, "phaseName", event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Phase Amount</Label>
                  <Input
                    value={phase.amount}
                    onChange={(event) =>
                      onPhaseChange(index, "amount", event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={phase.dueDate}
                    onChange={(event) =>
                      onPhaseChange(index, "dueDate", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded border border-white/40"
            onClick={onAddPhase}
            aria-label="Add project phase"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div>
            <Label>Total Projects Budget</Label>
            <Input
              value={String(totalProjectBudget)}
              readOnly
              className="cursor-not-allowed"
            />
          </div>

          <div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Projects Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => onStartDateChange(event.target.value)}
                />
              </div>
              <div>
                <Label>Projects End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => onEndDateChange(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(event) => onAddressChange(event.target.value)}
            />
          </div>
        </div>

        <div className="shrink-0 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="h-12" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, Eye, EyeOff, Plus, Upload, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createProject, getManagers } from "@/lib/api";
import { DASHBOARD_CATEGORY } from "@/lib/constants";
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

type ProjectImageItem = {
  id: string;
  file: File;
  preview: string;
};

type ClientForm = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
};

const createEmptyClient = (): ClientForm => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  clientName: "",
  clientEmail: "",
  clientPassword: "",
  confirmPassword: "",
  showPassword: false,
  showConfirmPassword: false,
});

export default function AddProjectPage() {
  const router = useRouter();
  const projectImagesRef = useRef<ProjectImageItem[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImageItem[]>([]);
  const [clients, setClients] = useState<ClientForm[]>(() => [createEmptyClient()]);
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

  useEffect(() => {
    projectImagesRef.current = projectImages;
  }, [projectImages]);

  useEffect(() => {
    return () => {
      projectImagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  const handleProjectImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const newItems = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setProjectImages((prev) => [...prev, ...newItems]);
    event.target.value = "";
  };

  const removeProjectImage = (imageId: string) => {
    setProjectImages((prev) => {
      const removed = prev.find((item) => item.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((item) => item.id !== imageId);
    });
  };

  const updateClientField = (
    clientId: string,
    field: "clientName" | "clientEmail" | "clientPassword" | "confirmPassword",
    value: string,
  ) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, [field]: value } : client,
      ),
    );
  };

  const toggleClientVisibility = (
    clientId: string,
    field: "showPassword" | "showConfirmPassword",
  ) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, [field]: !client[field] } : client,
      ),
    );
  };

  const addClient = () => {
    setClients((prev) => [...prev, createEmptyClient()]);
  };

  const removeClient = (clientId: string) => {
    setClients((prev) => prev.filter((client) => client.id !== clientId));
  };

  async function onSubmit(formData: FormData) {
    if (createProjectMutation.isPending) {
      return;
    }

    const projectName = String(formData.get("projectName") || "").trim();
    const category = DASHBOARD_CATEGORY;
    const startDate = String(formData.get("startDate") || "").trim();
    const endDate = String(formData.get("endDate") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const siteManagerId = String(formData.get("siteManagerId") || "").trim();

    const missingFields = [
      !projectName ? "Projects Name" : null,
      !startDate ? "Projects Start Date" : null,
      !endDate ? "Projects End Date" : null,
      !address ? "Address" : null,
      !siteManagerId ? "Site Manager" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    const normalizedClients = clients.map((client) => ({
      clientName: client.clientName.trim(),
      clientEmail: client.clientEmail.trim(),
      clientPassword: client.clientPassword,
      confirmPassword: client.confirmPassword,
    }));

    const incompleteClientIndex = normalizedClients.findIndex(
      (client) =>
        !client.clientName ||
        !client.clientEmail ||
        !client.clientPassword ||
        !client.confirmPassword,
    );

    if (incompleteClientIndex !== -1) {
      toast.error(`Complete all fields in Client ${incompleteClientIndex + 1}`);
      return;
    }

    const invalidPasswordClientIndex = normalizedClients.findIndex(
      (client) => client.clientPassword !== client.confirmPassword,
    );

    if (invalidPasswordClientIndex !== -1) {
      toast.error(
        `Password and confirm password must match in Client ${invalidPasswordClientIndex + 1}`,
      );
      return;
    }

    const normalizedClientEmails = normalizedClients.map((client) =>
      client.clientEmail.toLowerCase(),
    );
    if (new Set(normalizedClientEmails).size !== normalizedClientEmails.length) {
      toast.error("Client emails must be unique");
      return;
    }

    const hasIncompletePhase = phases.some((phase) =>
      phase.phaseName.trim() || phase.amount.trim() || phase.paymentDate
        ? !(phase.phaseName.trim() && phase.amount.trim() && phase.paymentDate)
        : false,
    );

    if (hasIncompletePhase) {
      toast.error("Complete or remove each phase before creating the project");
      return;
    }

    const normalizedPhases = phases
      .filter(
        (phase) =>
          phase.phaseName.trim() && phase.amount.trim() && phase.paymentDate,
      )
      .map((phase) => ({
        phaseName: phase.phaseName.trim(),
        amount: parseAmountInput(phase.amount),
        paymentDate: phase.paymentDate,
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

    const primaryClient = normalizedClients[0];
    const payload = new FormData();
    payload.set("clientName", primaryClient.clientName);
    payload.set("clientEmail", primaryClient.clientEmail);
    payload.set("clientPassword", primaryClient.clientPassword);
    payload.set("clientAccounts", JSON.stringify(
      normalizedClients.map((client) => ({
        name: client.clientName,
        email: client.clientEmail,
        password: client.clientPassword,
      })),
    ));
    payload.set("projectName", projectName);
    payload.set("category", category);
    payload.set("phases", JSON.stringify(normalizedPhases));
    payload.set("projectBudget", String(totalProjectBudget));
    payload.set("startDate", startDate);
    payload.set("endDate", endDate);
    payload.set("address", address);
    payload.set("siteManagerId", siteManagerId);
    projectImages.forEach((image) => payload.append("images", image.file));

    createProjectMutation.mutate(payload);
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="text-heading-40 inline-flex items-center gap-2"
      >
        <ChevronLeft className="h-6 w-6" /> Add new Projects
      </Link>
      <p className="text-body-16 text-white/80">
        Create and manage your projects
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Project Images</Label>
          <div className="mt-2 rounded-lg border border-dashed border-white/35 p-4">
            <label
              htmlFor="project-images"
              className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/25 px-3 py-2 text-sm text-white/90"
            >
              <Upload className="h-4 w-4" />
              Add Images
            </label>
            <Input
              id="project-images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleProjectImagesChange}
            />

            {projectImages.length === 0 ? (
              <p className="text-sm text-white/60">
                Upload multiple images and remove any with the close icon.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-28 overflow-hidden rounded-md border border-white/20"
                  >
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${image.preview})` }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                      onClick={() => removeProjectImage(image.id)}
                      aria-label="Remove project image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Client Information</Label>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-white/35 px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
              onClick={addClient}
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>

          {clients.map((client, index) => (
            <div key={client.id} className="space-y-4 rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-body-16 font-medium text-white">
                  Client {index + 1}
                </p>
                {clients.length > 1 ? (
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                    onClick={() => removeClient(client.id)}
                    aria-label={`Remove client ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div>
                <Label>Client Name</Label>
                <Input
                  value={client.clientName}
                  onChange={(event) =>
                    updateClientField(client.id, "clientName", event.target.value)
                  }
                  placeholder="Enter Client name"
                  required
                />
              </div>

              <div>
                <Label>Enter Email</Label>
                <Input
                  type="email"
                  value={client.clientEmail}
                  onChange={(event) =>
                    updateClientField(client.id, "clientEmail", event.target.value)
                  }
                  placeholder="Enter Email"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={client.showPassword ? "text" : "password"}
                      value={client.clientPassword}
                      onChange={(event) =>
                        updateClientField(client.id, "clientPassword", event.target.value)
                      }
                      placeholder="********"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-white/70"
                      onClick={() => toggleClientVisibility(client.id, "showPassword")}
                      aria-label={
                        client.showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {client.showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={client.showConfirmPassword ? "text" : "password"}
                      value={client.confirmPassword}
                      onChange={(event) =>
                        updateClientField(client.id, "confirmPassword", event.target.value)
                      }
                      placeholder="********"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-white/70"
                      onClick={() =>
                        toggleClientVisibility(client.id, "showConfirmPassword")
                      }
                      aria-label={
                        client.showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {client.showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label>Projects Name</Label>
          <Input name="projectName" placeholder="Enter project name" required />
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
                  onClick={() =>
                    setPhases((prev) => prev.filter((_, idx) => idx !== index))
                  }
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
                    setPhases((prev) =>
                      prev.map((item, idx) =>
                        idx === index
                          ? { ...item, phaseName: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Phase Amount</Label>
                <Input
                  value={phase.amount}
                  onChange={(e) =>
                    setPhases((prev) =>
                      prev.map((item, idx) =>
                        idx === index
                          ? { ...item, amount: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={phase.paymentDate}
                  onChange={(e) =>
                    setPhases((prev) =>
                      prev.map((item, idx) =>
                        idx === index
                          ? { ...item, paymentDate: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded border border-white/40"
          onClick={() =>
            setPhases((prev) => [
              ...prev,
              { phaseName: "", amount: "", paymentDate: "" },
            ])
          }
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

        <div className="grid gap-4 pt-2 md:grid-cols-2">
          <Link href="/projects">
            <Button type="button" variant="outline" className="h-12 w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="h-12"
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}

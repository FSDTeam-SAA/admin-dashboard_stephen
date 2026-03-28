"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard, getProjects, type Project } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { LayoutGrid, CheckCircle2, BookOpen } from "lucide-react";

type ProjectFilter = "all" | "finished" | "active";

export default function DashboardPage() {
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: () => getProjects(),
  });

  const filteredProjects = useMemo(() => {
    const allProjects = projects ?? [];
    const statusFiltered =
      projectFilter === "all"
        ? allProjects
        : allProjects.filter((project) => project.projectStatus === projectFilter);

    return [...statusFiltered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [projectFilter, projects]);

  const selectedFilterLabel =
    projectFilter === "all"
      ? "Total Projects"
      : projectFilter === "finished"
        ? "Total completed Projects"
        : "Ongoing Projects";

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-black p-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40 bg-white/10" />
          <Skeleton className="h-40 bg-white/10" />
          <Skeleton className="h-40 bg-white/10" />
        </div>
        <Skeleton className="h-[450px] bg-white/10" />
      </div>
    );
  }

  const summary = dashboardData?.summary;

  const statusBadgeClass = (status: Project["projectStatus"]) =>
    status === "finished"
      ? "border border-[#0f944f]/40 bg-[#0f944f]/20 text-[#86f3b8]"
      : "border border-[#1f6ad6]/40 bg-[#1f6ad6]/20 text-[#9dc6ff]";

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Create and manage your Category with ease.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Projects */}
        <Card
          className={`relative overflow-hidden border-none bg-[#C7C0FF] p-0 transition-transform hover:scale-[1.02] ${
            projectFilter === "all" ? "ring-2 ring-[#7d6ef4]" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setProjectFilter("all")}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7d6ef4] text-white">
                <LayoutGrid size={20} />
              </div>
              <span className="text-lg font-medium text-slate-800">Total Projects</span>
            </div>
            <p className="mt-6 text-5xl font-bold text-[#7d6ef4]">{summary?.totalProjects ?? 500}</p>
          </button>
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[#7d6ef4]" />
        </Card>

        {/* Completed Projects */}
        <Card
          className={`relative overflow-hidden border-none bg-[#D7F5E1] p-0 transition-transform hover:scale-[1.02] ${
            projectFilter === "finished" ? "ring-2 ring-[#0f944f]" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setProjectFilter("finished")}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f944f] text-white">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-lg font-medium text-slate-800">Total completed Projects</span>
            </div>
            <p className="mt-6 text-5xl font-bold text-[#0f944f]">{summary?.finishedProjects ?? 200}</p>
          </button>
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[#0f944f]" />
        </Card>

        {/* Ongoing Projects */}
        <Card
          className={`relative overflow-hidden border-none bg-[#D6E6FF] p-0 transition-transform hover:scale-[1.02] ${
            projectFilter === "active" ? "ring-2 ring-[#1f6ad6]" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setProjectFilter("active")}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f6ad6] text-white">
                <BookOpen size={20} />
              </div>
              <span className="text-lg font-medium text-slate-800">Ongoing Projects</span>
            </div>
            <p className="mt-6 text-5xl font-bold text-[#1f6ad6]">{summary?.activeProjects ?? 300}</p>
          </button>
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[#1f6ad6]" />
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-white">{selectedFilterLabel}</h2>
          <p className="text-sm text-gray-400">
            {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <Card className="overflow-hidden border border-white/10 bg-black/40">
          {isProjectsLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 bg-white/10" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-6 text-sm text-gray-300">
              No project data found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="text-sm font-semibold text-white">
                  <tr>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project._id}
                      className="border-t border-white/10 text-sm text-white/90"
                    >
                      <td className="px-6 py-4">{project.projectName}</td>
                      <td className="px-6 py-4">{project.clientName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadgeClass(project.projectStatus)}`}
                        >
                          {project.projectStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">{project.progress}%</td>
                      <td className="px-6 py-4">{formatDate(project.startDate)}</td>
                      <td className="px-6 py-4">{formatDate(project.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

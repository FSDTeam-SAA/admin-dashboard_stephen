"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getManagers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { paginate } from "@/lib/utils";

const PAGE_SIZE = 9;

export default function ManagersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["managers"], queryFn: getManagers });

  const filtered = useMemo(
    () => (data ?? []).filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );
  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-40">Mange Manager&apos;s</h2>
        <p className="text-body-16 text-white/80">Create and manage your Mange Manager&apos;s</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className="pl-10" />
        </div>
        <Link href="/managers/new">
          <Button className="h-12 whitespace-nowrap">
            <Plus className="mr-1 h-5 w-5" /> Add New Manger
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
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
                  <tr key={manager._id} className="text-body-16 border-t border-white/10">
                    <td className="px-5 py-4">{manager.name}</td>
                    <td className="px-5 py-4">{manager.email}</td>
                    <td className="px-5 py-4">Site Manager</td>
                    <td className="px-5 py-4">{manager.assignedProjects?.length ?? 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-white"><Eye className="h-5 w-5" /></button>
                        <button className="text-red-400"><Trash2 className="h-5 w-5" /></button>
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
          Showing {(paged.page - 1) * PAGE_SIZE + 1} to {Math.min(paged.page * PAGE_SIZE, paged.total)} of {paged.total} results
        </p>
        <PaginationBar page={paged.page} totalPages={paged.totalPages} onChange={setPage} />
      </div>
    </div>
  );
}


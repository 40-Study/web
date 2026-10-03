"use client";

import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrgId, useOrgClasses, useOrgDetail, useOrgMembers } from "@/hooks/queries/use-org-area";

const ALL = { keyword: "", status: "", page: 1 };
const ACTIVE = { keyword: "", status: "active", page: 1 };
const DRAFT = { keyword: "", status: "draft", page: 1 };

/** Tổng quan tổ chức: tên, số thành viên, số lớp theo trạng thái, lối vào thành viên và lớp học. */
export default function OrgOverviewPage() {
  const orgId = useActiveOrgId();
  const org = useOrgDetail(orgId);
  const members = useOrgMembers(orgId);
  const allClasses = useOrgClasses(orgId, ALL);
  const activeClasses = useOrgClasses(orgId, ACTIVE);
  const draftClasses = useOrgClasses(orgId, DRAFT);

  if (!orgId) {
    return (
      <QueryState isEmpty emptyTitle="Chưa chọn tổ chức" emptyDescription="Vai trò hiện tại không gắn với tổ chức nào. Hãy đăng nhập lại và chọn vai trò Chủ tổ chức.">
        {null}
      </QueryState>
    );
  }

  const stats = [
    { label: "Thành viên", value: members.data?.length, href: "/org/members", icon: Users },
    { label: "Lớp học", value: allClasses.data?.total, href: "/org/classes", icon: GraduationCap },
    { label: "Lớp đang hoạt động", value: activeClasses.data?.total, href: "/org/classes?status=active", icon: GraduationCap },
    { label: "Lớp đang nháp", value: draftClasses.data?.total, href: "/org/classes?status=draft", icon: GraduationCap },
  ];

  return (
    <QueryState isLoading={org.isLoading} isError={org.isError} error={org.error} onRetry={() => org.refetch()} isEmpty={!org.data} emptyTitle="Không tìm thấy tổ chức">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold">{org.data?.name}</h2>
          {org.data?.description && <p className="mt-1 text-sm text-muted-foreground">{org.data.description}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Card className="h-full transition-colors hover:border-primary-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold" aria-label={`${s.label}: ${s.value ?? "đang tải"}`}>
                    {s.value ?? "…"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </QueryState>
  );
}

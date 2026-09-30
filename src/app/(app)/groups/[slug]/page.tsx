"use client";

import { useParams } from "next/navigation";
import { GroupDetailView } from "@/components/groups/group-detail-view";

export default function GroupDetailPage() {
  const params = useParams<{ slug: string }>();
  return <GroupDetailView slug={params.slug} />;
}

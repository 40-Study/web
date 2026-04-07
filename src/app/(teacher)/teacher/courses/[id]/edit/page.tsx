"use client";

import { useParams, redirect } from "next/navigation";

/** /teacher/courses/[id]/edit → redirect to /teacher/courses/[id] */
export default function EditRedirect() {
  const params = useParams<{ id: string }>();
  redirect(`/teacher/courses/${params.id}`);
}

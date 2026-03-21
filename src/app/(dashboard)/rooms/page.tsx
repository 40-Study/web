"use client";

import { useState } from "react";
import Link from "next/link";
import { useSessions, useCreateSession } from "@/hooks/queries/use-livestream";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";

export default function RoomsPage() {
  const { data, isLoading } = useSessions();
  const createSession = useCreateSession();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate(
      { title, class_id: classId },
      {
        onSuccess: () => {
          setShowForm(false);
          setTitle("");
          setClassId("");
        },
      }
    );
  };

  const liveSessions = data?.filter((s) => s.status === "live") || [];
  const scheduledSessions = data?.filter((s) => s.status === "scheduled") || [];
  const endedSessions = data?.filter((s) => s.status === "ended") || [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Phòng học trực tuyến</h1>
        <Can permission={[PERMISSIONS.CREATE_CLASS, PERMISSIONS.MANAGE_OWN_CLASSES]}>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Hủy" : "Tạo phiên học"}
          </Button>
        </Can>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tiêu đề phiên học"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="ID lớp học"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="mt-4" disabled={createSession.isPending}>
            {createSession.isPending ? "Đang tạo..." : "Tạo phiên học"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live sessions */}
          {liveSessions.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Đang diễn ra
              </h2>
              <div className="space-y-3">
                {liveSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/classroom/${session.id}`}
                    className="block rounded-xl bg-white p-4 shadow-sm ring-2 ring-red-100 transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{session.title}</h3>
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                        LIVE
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {session.participant_count} người tham gia
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Scheduled sessions */}
          {scheduledSessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">Sắp diễn ra</h2>
              <div className="space-y-3">
                {scheduledSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/classroom/${session.id}`}
                    className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">Chờ bắt đầu</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Ended sessions */}
          {endedSessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">Đã kết thúc</h2>
              <div className="space-y-3">
                {endedSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <h3 className="font-medium text-gray-700">{session.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {session.participant_count} người đã tham gia
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data?.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">Chưa có phiên học nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

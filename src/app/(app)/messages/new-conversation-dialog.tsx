"use client";

import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateDirectConversation } from "@/hooks/queries/use-conversations";
import { contactsState } from "./teacher-contacts";
import {
  useParentTeacherContacts,
  useStudentTeacherContacts,
  type TeacherContactsQuery,
} from "./use-teacher-contacts";

type Audience = "student" | "parent";

/** Thông điệp trạng thái rỗng theo vai — "chưa có khoá" và "thiếu dữ liệu GV" là 2 câu khác nhau (N12). */
const EMPTY_COPY: Record<Audience, { noCourses: string; missing: string }> = {
  student: {
    noCourses: "Bạn chưa đăng ký khoá học nào nên chưa có giáo viên để nhắn tin.",
    missing: "Bạn đang có khoá học nhưng chưa tải được thông tin giáo viên. Vui lòng thử lại sau.",
  },
  parent: {
    noCourses: "Con của bạn chưa đăng ký khoá học nào (hoặc bạn chưa liên kết với con) nên chưa có giáo viên để nhắn tin.",
    missing: "Con của bạn đang có khoá học nhưng chưa tải được thông tin giáo viên. Vui lòng thử lại sau.",
  },
};

function ContactsBody({
  audience,
  query,
  onPick,
  isCreating,
}: {
  audience: Audience;
  query: TeacherContactsQuery;
  onPick: (teacherId: string) => void;
  isCreating: boolean;
}) {
  if (query.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="py-4 space-y-3">
        <p className="text-sm text-muted-foreground">Không tải được danh sách giáo viên.</p>
        <Button size="sm" variant="outline" onClick={query.refetch}>Thử lại</Button>
      </div>
    );
  }
  const state = contactsState(query.result);
  if (state !== "ready") {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {state === "no-courses" ? EMPTY_COPY[audience].noCourses : EMPTY_COPY[audience].missing}
      </p>
    );
  }
  return (
    <div className="space-y-1 py-2 max-h-80 overflow-y-auto">
      {query.result.contacts.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={isCreating}
          onClick={() => onPick(t.id)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 text-left transition-colors disabled:opacity-50"
        >
          <Avatar src={t.avatar} fallback={t.name[0] ?? "?"} size="sm" />
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{t.name}</span>
            <span className="block text-xs text-muted-foreground truncate">{t.contexts.join(" · ")}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// Mỗi vai một component riêng để chỉ hook của vai đó được mount (phụ huynh không gọi /enrollments,
// học sinh không gọi /me/children).
function StudentContacts(props: { onPick: (id: string) => void; isCreating: boolean }) {
  return <ContactsBody audience="student" query={useStudentTeacherContacts()} {...props} />;
}
function ParentContacts(props: { onPick: (id: string) => void; isCreating: boolean }) {
  return <ContactsBody audience="parent" query={useParentTeacherContacts()} {...props} />;
}

/**
 * Modal "Tin nhắn mới" — chọn giáo viên để bắt đầu hội thoại (`POST /conversations/direct`).
 * Học sinh: giáo viên các khoá đang học (E1). Phụ huynh: giáo viên các khoá của con (E2).
 */
export function NewConversationDialog({
  audience,
  open,
  onOpenChange,
  onCreated,
}: {
  audience: Audience;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}) {
  const createConv = useCreateDirectConversation();
  const handlePick = (teacherId: string) => {
    createConv.mutate(teacherId, {
      onSuccess: (conv) => {
        onCreated(conv.id);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{audience === "parent" ? "Nhắn tin cho giáo viên của con" : "Nhắn tin cho giáo viên"}</DialogTitle>
        </DialogHeader>
        {open &&
          (audience === "parent" ? (
            <ParentContacts onPick={handlePick} isCreating={createConv.isPending} />
          ) : (
            <StudentContacts onPick={handlePick} isCreating={createConv.isPending} />
          ))}
      </DialogContent>
    </Dialog>
  );
}

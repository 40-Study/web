"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClassOrganizationField } from "@/components/teacher/class-organization-field";
import { classService, type Class } from "@/services/class.service";

/**
 * Form tạo lớp trong một khoá. Người dùng thuộc tổ chức thì có ô chọn tổ chức; chọn tổ chức thì gửi
 * `organization_id`, không chọn thì lớp là lớp cá nhân (bỏ trống field, backend để NULL).
 */
export function ClassCreateForm({
  courseId,
  onCreated,
  onCancel,
}: {
  courseId: string;
  onCreated: (created: Class) => void;
  /** Có thì hiện nút "Hủy" (khi đã có lớp khác để quay về danh sách). */
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = await classService.create(courseId, {
        name: name.trim(),
        description: desc.trim() || undefined,
        max_students: maxStudents ? parseInt(maxStudents) : undefined,
        organization_id: organizationId || undefined,
      });
      toast.success("Đã tạo lớp học");
      setName("");
      setDesc("");
      setMaxStudents("");
      setOrganizationId("");
      onCreated(created);
    } catch {
      toast.error("Không thể tạo lớp học");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Tên lớp *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Lớp A - K67" />
      </div>
      <div className="space-y-1.5">
        <Label>Mô tả</Label>
        <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả về lớp học..." />
      </div>
      <div className="space-y-1.5">
        <Label>Số học viên tối đa</Label>
        <Input type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} placeholder="30" className="w-32" />
      </div>
      <ClassOrganizationField value={organizationId} onChange={setOrganizationId} />
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
        )}
        <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1">
          {creating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          Tạo lớp
        </Button>
      </div>
    </div>
  );
}

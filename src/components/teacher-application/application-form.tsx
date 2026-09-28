"use client";

/** Form hồ sơ ứng tuyển giảng viên — dùng cho cả nộp lần đầu và sửa để nộp lại. */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TeacherProfileFields, TeacherProfileInput } from "@/types/approval";

interface ApplicationFormProps {
  initial?: TeacherProfileFields;
  submitLabel: string;
  submitTestId: string;
  isPending?: boolean;
  onSubmit: (data: TeacherProfileInput) => void;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900";

/** "" → undefined: backend coi field vắng mặt là "không khai", không lưu chuỗi rỗng. */
function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function ApplicationForm({
  initial,
  submitLabel,
  submitTestId,
  isPending,
  onSubmit,
}: ApplicationFormProps) {
  const [specialization, setSpecialization] = useState(initial?.specialization ?? "");
  const [education, setEducation] = useState(initial?.education ?? "");
  const [experienceYears, setExperienceYears] = useState(
    initial?.experience_years != null ? String(initial.experience_years) : ""
  );
  const [certificateInfo, setCertificateInfo] = useState(initial?.certificate_info ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");

  const years = experienceYears.trim() === "" ? undefined : Number(experienceYears);
  const isYearsValid = years === undefined || (Number.isInteger(years) && years >= 0 && years <= 60);
  // Chuyên môn là thông tin tối thiểu để admin đánh giá — không cho nộp hồ sơ trống trơn.
  const canSubmit = specialization.trim().length > 0 && isYearsValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      specialization: optional(specialization),
      education: optional(education),
      experience_years: years,
      certificate_info: optional(certificateInfo),
      department: optional(department),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="teacher-application-form">
      <Field id="specialization" label="Chuyên môn" required>
        <input
          id="specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="VD: Toán THPT, Lập trình Web"
          className={INPUT_CLASS}
        />
      </Field>
      <Field id="department" label="Bộ môn">
        <input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="VD: Khoa học tự nhiên"
          className={INPUT_CLASS}
        />
      </Field>
      <Field id="experience_years" label="Số năm kinh nghiệm">
        <input
          id="experience_years"
          type="number"
          min={0}
          max={60}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          className={INPUT_CLASS}
        />
        {!isYearsValid && (
          <p className="mt-1 text-xs text-red-600">Số năm kinh nghiệm phải là số nguyên từ 0 đến 60.</p>
        )}
      </Field>
      <Field id="education" label="Học vấn">
        <textarea
          id="education"
          rows={3}
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          placeholder="VD: Thạc sĩ Toán học — ĐH Sư phạm Hà Nội"
          className={INPUT_CLASS}
        />
      </Field>
      <Field id="certificate_info" label="Bằng cấp / chứng chỉ">
        <textarea
          id="certificate_info"
          rows={3}
          value={certificateInfo}
          onChange={(e) => setCertificateInfo(e.target.value)}
          placeholder="VD: Chứng chỉ nghiệp vụ sư phạm, IELTS 7.5"
          className={INPUT_CLASS}
        />
      </Field>
      <Button type="submit" disabled={!canSubmit} isLoading={isPending} data-testid={submitTestId}>
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

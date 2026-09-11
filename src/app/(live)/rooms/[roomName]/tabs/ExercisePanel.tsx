'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { api } from '@/lib/meet/api';
import { getMe, type User } from '@/lib/meet/auth';
import type { Assignment, CreateAssignment } from '@/lib/meet/types-assignment';
import RichTextEditor, { RichTextViewer } from '@/components/meet/RichTextEditor';

// Modern color palette
const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#262626',
  primary: '#ff8e80',
  primaryDim: '#ff7162',
  accent: '#3b82f6',
  text: '#ffffff',
  textMuted: '#adaaaa',
  textDim: '#767575',
  border: '#484847',
  borderDim: 'rgba(72,72,71,0.3)',
  success: '#00c864',
  warning: '#ffb020',
  danger: '#ff6352',
};

const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'java', label: 'Java' },
];

const DIFFICULTY_COLORS = {
  easy: COLORS.success,
  medium: COLORS.warning,
  hard: COLORS.danger,
};

interface TestCaseInput {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

const DEFAULT_TEST_CASE: TestCaseInput = {
  input: '',
  expected_output: '',
  is_hidden: false,
};

type ExerciseType = 'code' | 'multiple_choice' | 'essay';

interface MCQuestion {
  question: string;
  answers: [string, string, string, string];
  correctIndex: number;
}

interface MultipleChoiceForm {
  title: string;
  questions: MCQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

interface EssayForm {
  title: string;
  question: string; // Rich text HTML
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  minWords?: number;
  maxWords?: number;
  scheduleTime?: string; // HH:mm format, will open at this time today
}

export default function ExercisePanel({
  sessionId,
  hostId,
  onClose,
  onBroadcast,
  currentUserId,
  zIndex = 200,
  onFocus,
}: {
  sessionId: string;
  hostId: string;
  onClose: () => void;
  onBroadcast?: (event: any) => void;
  currentUserId?: string;
  zIndex?: number;
  onFocus?: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  // Xác nhận trước khi xóa bài tập (M-12) — thay confirm() gốc của trình duyệt
  // bằng overlay theo đúng theme tối của phòng học, không lệch design system.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Screen flow: 'list' -> 'select-type' -> 'create'
  const [screen, setScreen] = useState<'list' | 'select-type' | 'create'>('list');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('code');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAssignment>({
    session_id: sessionId,
    title: '',
    description: '',
    difficulty: 'medium',
    language: ['python'],
    starter_code: '',
    time_limit: 300,
    memory_limit: 256,
  });
  const [testCases, setTestCases] = useState<TestCaseInput[]>([{ ...DEFAULT_TEST_CASE }]);
  const [mcForm, setMcForm] = useState<MultipleChoiceForm>({
    title: '',
    questions: [{ question: '', answers: ['', '', '', ''], correctIndex: 0 }],
    difficulty: 'medium',
    timeLimit: 60,
  });
  const [essayForm, setEssayForm] = useState<EssayForm>({
    title: '',
    question: '',
    difficulty: 'medium',
    timeLimit: 600,
    minWords: 50,
    maxWords: 500,
  });
  const [codeScheduleTime, setCodeScheduleTime] = useState(''); // HH:mm for code form

  // Panel position for dragging
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 50 });

  // Submission viewing state
  const [viewingSubmissions, setViewingSubmissions] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  const isHost = user?.id === hostId;

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get<{ data: Assignment[] }>(`/assignments?session_id=${sessionId}`);
      setAssignments(res.data ?? []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Fetch submission counts for all published assignments
  const fetchSubmissionCounts = useCallback(async () => {
    const published = assignments.filter(a => a.is_published);
    const counts: Record<string, number> = {};
    for (const a of published) {
      try {
        const res = await api.get<{ data: any[], total: number }>(`/submissions/assignment/${a.id}?page_size=1`);
        counts[a.id] = res.total ?? res.data?.length ?? 0;
      } catch {
        counts[a.id] = 0;
      }
    }
    setSubmissionCounts(counts);
  }, [assignments]);

  useEffect(() => {
    if (assignments.length > 0) {
      fetchSubmissionCounts();
    }
  }, [assignments, fetchSubmissionCounts]);

  const handleViewSubmissions = async (assignment: Assignment) => {
    setViewingSubmissions(assignment);
    setLoadingSubmissions(true);
    setSelectedSubmission(null);
    try {
      const res = await api.get<{ data: any[] }>(`/submissions/assignment/${assignment.id}`);
      setSubmissions(res.data ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSelectType = (type: ExerciseType) => {
    // Reset all forms when creating new
    setEditingId(null);
    setForm({
      session_id: sessionId,
      title: '',
      description: '',
      difficulty: 'medium',
      language: ['python'],
      starter_code: '',
      time_limit: 300,
      memory_limit: 256,
      start_time: undefined,
    });
    setTestCases([{ ...DEFAULT_TEST_CASE }]);
    setCodeScheduleTime('');
    setEssayForm({
      title: '',
      question: '',
      difficulty: 'medium',
      timeLimit: 600,
      minWords: 50,
      maxWords: 500,
      scheduleTime: undefined,
    });
    setMcForm({
      title: '',
      questions: [{ question: '', answers: ['', '', '', ''], correctIndex: 0 }],
      difficulty: 'medium',
      timeLimit: 60,
    });

    setExerciseType(type);
    setScreen('create');
  };

  // Helper to format date with local timezone (not UTC)
  const formatLocalISO = (date: Date): string => {
    const tzOffset = -date.getTimezoneOffset();
    const tzHours = Math.floor(Math.abs(tzOffset) / 60).toString().padStart(2, '0');
    const tzMins = (Math.abs(tzOffset) % 60).toString().padStart(2, '0');
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${min}:00${tzSign}${tzHours}:${tzMins}`;
  };

  // Convert HH:mm to ISO string with local timezone
  const scheduleTimeToISO = (timeStr: string): string | undefined => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return undefined;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (hours > 23 || minutes > 59) return undefined;
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
    return formatLocalISO(scheduled);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Convert codeScheduleTime to start_time before submit
      const startTime = codeScheduleTime ? scheduleTimeToISO(codeScheduleTime) : undefined;

      // 1. Create assignment
      const createRes = await api.post<{ data: { id: string } }>(`/assignments`, {
        ...form,
        start_time: startTime,
      });
      const assignmentId = createRes.data?.id;
      if (!assignmentId) throw new Error('Tạo bài thất bại');

      // 2. Add test cases
      const validTestCases = testCases.filter((tc) => tc.input.trim() && tc.expected_output.trim());
      for (let i = 0; i < validTestCases.length; i++) {
        const tc = validTestCases[i];
        await api.post(`/assignments/${assignmentId}/testcases`, {
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          display_order: i + 1,
        });
      }

      // If scheduled, auto-publish so it broadcasts when time arrives
      if (startTime) {
        await api.post(`/assignments/${assignmentId}/publish`, { session_id: sessionId });
      }
      setScreen('list');
      setForm({
        session_id: sessionId,
        title: '',
        description: '',
        difficulty: 'medium',
        language: ['python'],
        starter_code: '',
        time_limit: 300,
        memory_limit: 256,
        start_time: undefined,
      });
      setTestCases([{ ...DEFAULT_TEST_CASE }]);
      setCodeScheduleTime('');
      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Tạo bài tập thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateMC = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate title
    if (!mcForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài trắc nghiệm');
      return;
    }
    // Validate each question
    for (let i = 0; i < mcForm.questions.length; i++) {
      const q = mcForm.questions[i];
      const plainText = q.question.replace(/<[^>]*>/g, '').trim();
      if (!plainText || q.question === '<p></p>') {
        alert(`Vui lòng nhập nội dung câu hỏi ${i + 1}`);
        return;
      }
      if (q.answers.some(a => !a.trim())) {
        alert(`Vui lòng nhập đủ 4 đáp án cho câu ${i + 1}`);
        return;
      }
    }
    setCreating(true);
    try {
      // Create multiple choice assignment with multiple questions
      const createRes = await api.post<{ data: { id: string } }>(`/assignments`, {
        session_id: sessionId,
        title: mcForm.title,
        description: `Bài trắc nghiệm gồm ${mcForm.questions.length} câu hỏi`,
        difficulty: mcForm.difficulty,
        language: [],
        starter_code: JSON.stringify({
          type: 'multiple_choice',
          questions: mcForm.questions,
        }),
        time_limit: mcForm.timeLimit,
        memory_limit: 0,
      });
      const assignmentId = createRes.data?.id;
      if (!assignmentId) throw new Error('Tạo bài thất bại');

      // Don't publish yet - just save to list
      setScreen('list');
      setMcForm({
        title: '',
        questions: [{ question: '', answers: ['', '', '', ''], correctIndex: 0 }],
        difficulty: 'medium',
        timeLimit: 60,
      });
      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Tạo bài tập thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    if (!essayForm.question.trim() || essayForm.question === '<p></p>') {
      alert('Vui lòng nhập đề bài');
      return;
    }
    setCreating(true);
    try {
      const createRes = await api.post<{ data: { id: string } }>(`/assignments`, {
        session_id: sessionId,
        title: essayForm.title,
        description: essayForm.question, // Rich text HTML
        difficulty: essayForm.difficulty,
        language: [],
        starter_code: JSON.stringify({
          type: 'essay',
          minWords: essayForm.minWords,
          maxWords: essayForm.maxWords,
        }),
        time_limit: essayForm.timeLimit,
        memory_limit: 0,
        start_time: essayForm.scheduleTime ? (() => {
          // Convert HH:mm to full datetime (today, or tomorrow if time passed)
          const [hours, minutes] = essayForm.scheduleTime.split(':').map(Number);
          const now = new Date();
          const scheduled = new Date();
          scheduled.setHours(hours, minutes, 0, 0);
          if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
          return scheduled.toISOString();
        })() : undefined,
      });
      const assignmentId = createRes.data?.id;
      if (!assignmentId) throw new Error('Tạo bài thất bại');

      setScreen('list');
      setEssayForm({
        title: '',
        question: '',
        difficulty: 'medium',
        timeLimit: 600,
        minWords: 50,
        maxWords: 500,
        scheduleTime: undefined,
      });
      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Tạo bài tập thất bại');
    } finally {
      setCreating(false);
    }
  };

  // Upload image to MinIO via backend
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'study-assignments');

    const res = await api.upload<{ data: { url: string } }>('/upload', formData);
    if (!res.data?.url) throw new Error('Upload failed');
    return res.data.url;
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Xóa thất bại');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = async (assignment: Assignment) => {
    // Load assignment data into form
    setForm({
      session_id: sessionId,
      title: assignment.title,
      description: assignment.description || '',
      difficulty: assignment.difficulty as 'easy' | 'medium' | 'hard',
      language: assignment.language || ['python'],
      starter_code: assignment.starter_code || '',
      time_limit: assignment.time_limit || 300,
      memory_limit: assignment.memory_limit || 256,
      start_time: assignment.start_time,
    });

    // Load schedule time if exists
    if (assignment.start_time) {
      const startDate = new Date(assignment.start_time);
      const hours = startDate.getHours().toString().padStart(2, '0');
      const minutes = startDate.getMinutes().toString().padStart(2, '0');
      setCodeScheduleTime(`${hours}:${minutes}`);
    } else {
      setCodeScheduleTime('');
    }

    // Load test cases
    try {
      const res = await api.get<{ data: any[] }>(`/assignments/${assignment.id}/testcases?include_hidden=true`);
      if (res.data && res.data.length > 0) {
        setTestCases(res.data.map(tc => ({
          input: tc.input || '',
          expected_output: tc.expected_output || '',
          is_hidden: tc.is_hidden || false,
        })));
      } else {
        setTestCases([{ ...DEFAULT_TEST_CASE }]);
      }
    } catch {
      setTestCases([{ ...DEFAULT_TEST_CASE }]);
    }

    setEditingId(assignment.id);
    setExerciseType('code');
    setScreen('create');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setCreating(true);
    try {
      // Convert codeScheduleTime to start_time before submit
      // If codeScheduleTime is empty, explicitly set to null to clear it
      const startTime = codeScheduleTime ? scheduleTimeToISO(codeScheduleTime) : null;

      // Update assignment
      await api.put(`/assignments/${editingId}`, {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        language: form.language,
        starter_code: form.starter_code,
        time_limit: form.time_limit,
        memory_limit: form.memory_limit,
        start_time: startTime,
      });

      // Delete old test cases and add new ones
      // First get existing ones
      const existingRes = await api.get<{ data: any[] }>(`/assignments/${editingId}/testcases?include_hidden=true`);
      const existingTCs = existingRes.data || [];

      // Delete old ones
      for (const tc of existingTCs) {
        await api.delete(`/assignments/${editingId}/testcases/${tc.id}`);
      }

      // Add new ones
      const validTestCases = testCases.filter(tc => tc.input.trim() && tc.expected_output.trim());
      for (let i = 0; i < validTestCases.length; i++) {
        const tc = validTestCases[i];
        await api.post(`/assignments/${editingId}/testcases`, {
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          display_order: i + 1,
        });
      }

      setScreen('list');
      setEditingId(null);
      setForm({
        session_id: sessionId,
        title: '',
        description: '',
        difficulty: 'medium',
        language: ['python'],
        starter_code: '',
        time_limit: 300,
        memory_limit: 256,
        start_time: undefined,
      });
      setTestCases([{ ...DEFAULT_TEST_CASE }]);
      setCodeScheduleTime('');
      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Cập nhật thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handlePublishAssignment = async (assignment: Assignment) => {
    try {
      // Publish to backend
      await api.post(`/assignments/${assignment.id}/publish`, { session_id: sessionId });

      // Only broadcast immediately if no start_time or start_time has passed
      const hasSchedule = assignment.start_time && new Date(assignment.start_time) > new Date();
      if (!hasSchedule) {
        onBroadcast?.({
          type: 'exercise_published',
          assignmentId: assignment.id,
          title: assignment.title,
          senderId: currentUserId,
        });
      }

      fetchAssignments();
    } catch (err: any) {
      alert(err.message ?? 'Gửi bài thất bại');
    }
  };

  // Auto-broadcast scheduled assignments when start_time arrives
  const broadcastedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      assignments.forEach(a => {
        if (a.is_published && a.start_time) {
          const startTime = new Date(a.start_time);
          const timeDiff = startTime.getTime() - now.getTime();
          // If start time has arrived (within 5 seconds) and not already broadcast
          if (timeDiff <= 0 && timeDiff > -5000 && !broadcastedRef.current.has(a.id)) {
            broadcastedRef.current.add(a.id);
            onBroadcast?.({
              type: 'exercise_published',
              assignmentId: a.id,
              title: a.title,
              senderId: currentUserId,
              isScheduled: true,
            });
          }
        }
      });
    };

    const interval = setInterval(checkScheduled, 1000);
    return () => clearInterval(interval);
  }, [assignments, onBroadcast, currentUserId]);

  const handleToggleLang = (langId: string) => {
    setForm((f) => ({
      ...f,
      language: f.language.includes(langId)
        ? f.language.filter((l) => l !== langId)
        : [...f.language, langId],
    }));
  };

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { ...DEFAULT_TEST_CASE }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCaseInput, value: string | boolean) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  };

  const published = assignments.filter((a) => a.is_published);
  const all = assignments;

  return (
    <>
      {/* Floating Panel - Draggable */}
      <DraggableExercisePanel position={panelPosition} onPositionChange={setPanelPosition} zIndex={zIndex} onFocus={onFocus}>
      {/* Header - Drag handle */}
      <div
        data-drag-handle
        style={{
          padding: '20px 24px',
          flexShrink: 0,
          borderBottom: `1px solid ${COLORS.borderDim}`,
          background: COLORS.surface,
          cursor: 'grab',
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.accent}30 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
                <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
              </svg>
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.text,
              fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.2,
            }}>
              Quản lý <span style={{ color: COLORS.primary }}>bài tập</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: COLORS.surfaceHigh,
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.border;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = COLORS.surfaceHigh;
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: COLORS.textMuted,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          Tạo, chỉnh sửa và gửi bài tập cho học viên
          <span style={{
            background: `${COLORS.primary}25`,
            color: COLORS.primary,
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '6px',
          }}>
            {all.length} bài
          </span>
        </p>
      </div>

      {/* Create form - Center Modal */}
      {screen === 'create' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: '16px',
              width: exerciseType === 'essay' ? '850px' : exerciseType === 'code' ? '800px' : '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: `1px solid ${COLORS.borderDim}`,
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${COLORS.borderDim}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.text,
                  fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
                }}>
                  {editingId ? 'Sửa bài tập' : exerciseType === 'code' ? 'Tạo bài Code' : exerciseType === 'essay' ? 'Tạo bài Tự luận' : 'Tạo trắc nghiệm'}
                </h2>
                {!editingId && (
                  <button
                    type="button"
                    onClick={() => setScreen('select-type')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: COLORS.textMuted,
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '4px',
                    }}
                  >
                    Đổi loại bài tập →
                  </button>
                )}
              </div>
              <button
                onClick={() => { setScreen('list'); setEditingId(null); }}
                style={{
                  background: COLORS.surfaceHigh,
                  border: 'none',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
          {exerciseType === 'essay' ? (
            // Essay Form
            <form onSubmit={handleCreateEssay} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Tiêu đề *</label>
                <input
                  type="text"
                  value={essayForm.title}
                  onChange={(e) => setEssayForm({ ...essayForm, title: e.target.value })}
                  required
                  placeholder="Ví dụ: Phân tích thuật toán sắp xếp"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Đề bài *</label>
                <RichTextEditor
                  content={essayForm.question}
                  onChange={(html) => setEssayForm({ ...essayForm, question: html })}
                  onImageUpload={handleImageUpload}
                  placeholder="Nhập đề bài với định dạng phong phú, có thể chèn hình ảnh..."
                  minHeight="200px"
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Độ khó</label>
                  <select
                    value={essayForm.difficulty}
                    onChange={(e) => setEssayForm({ ...essayForm, difficulty: e.target.value as any })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Thời gian (phút)</label>
                  <input
                    type="number"
                    value={Math.floor(essayForm.timeLimit / 60)}
                    onChange={(e) => setEssayForm({ ...essayForm, timeLimit: (parseInt(e.target.value) || 10) * 60 })}
                    min={1}
                    max={120}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Số từ tối thiểu</label>
                  <input
                    type="number"
                    value={essayForm.minWords}
                    onChange={(e) => setEssayForm({ ...essayForm, minWords: parseInt(e.target.value) || 0 })}
                    min={0}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Số từ tối đa</label>
                  <input
                    type="number"
                    value={essayForm.maxWords}
                    onChange={(e) => setEssayForm({ ...essayForm, maxWords: parseInt(e.target.value) || 500 })}
                    min={10}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Hẹn giờ mở (để trống = mở ngay)</label>
                <input
                  type="text"
                  value={essayForm.scheduleTime || ''}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9:]/g, '');
                    if (v.length === 2 && !v.includes(':')) v += ':';
                    if (v.length > 5) v = v.slice(0, 5);
                    setEssayForm({ ...essayForm, scheduleTime: v || undefined });
                  }}
                  placeholder="VD: 14:30"
                  maxLength={5}
                  style={{ ...inputStyle, width: '100px', textAlign: 'center' }}
                />
                {essayForm.scheduleTime && /^\d{2}:\d{2}$/.test(essayForm.scheduleTime) && (
                  <span style={{ marginLeft: '12px', color: COLORS.textMuted, fontSize: '13px' }}>
                    Sẽ mở lúc {essayForm.scheduleTime} {(() => {
                      const [h, m] = essayForm.scheduleTime.split(':').map(Number);
                      if (h > 23 || m > 59) return '(giờ không hợp lệ)';
                      const now = new Date();
                      const scheduled = new Date();
                      scheduled.setHours(h, m, 0, 0);
                      return scheduled <= now ? 'ngày mai' : 'hôm nay';
                    })()}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  background: creating ? COLORS.surfaceHigh : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  color: creating ? COLORS.textDim : '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                }}
              >
                {creating ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo bài tự luận'
                )}
              </button>
            </form>
          ) : exerciseType === 'multiple_choice' ? (
            // Multiple Choice Form with Multiple Questions
            <form onSubmit={handleCreateMC} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Tiêu đề bài trắc nghiệm *</label>
                <input
                  type="text"
                  value={mcForm.title}
                  onChange={(e) => setMcForm({ ...mcForm, title: e.target.value })}
                  required
                  placeholder="VD: Kiểm tra chương 1"
                  style={inputStyle}
                />
              </div>

              {/* Questions List */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '12px', display: 'block' }}>Danh sách câu hỏi ({mcForm.questions.length})</label>

                {/* Each Question */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                  {mcForm.questions.map((q, qIdx) => (
                    <div key={qIdx} style={{
                      background: COLORS.surfaceHigh,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${COLORS.borderDim}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.primary }}>
                          Câu {qIdx + 1}
                        </span>
                        {mcForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newQuestions = mcForm.questions.filter((_, i) => i !== qIdx);
                              setMcForm({ ...mcForm, questions: newQuestions });
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: COLORS.danger,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Question Text */}
                      <div style={{ marginBottom: '12px' }}>
                        <RichTextEditor
                          content={q.question}
                          onChange={(html) => {
                            const newQuestions = [...mcForm.questions];
                            newQuestions[qIdx] = { ...newQuestions[qIdx], question: html };
                            setMcForm({ ...mcForm, questions: newQuestions });
                          }}
                          onImageUpload={handleImageUpload}
                          placeholder="Nhập câu hỏi..."
                          minHeight="60px"
                        />
                      </div>

                      {/* Answer Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.answers.map((answer, aIdx) => (
                          <div key={aIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const newQuestions = [...mcForm.questions];
                                newQuestions[qIdx] = { ...newQuestions[qIdx], correctIndex: aIdx };
                                setMcForm({ ...mcForm, questions: newQuestions });
                              }}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: q.correctIndex === aIdx
                                  ? `2px solid ${COLORS.success}`
                                  : `1px solid ${COLORS.borderDim}`,
                                background: q.correctIndex === aIdx
                                  ? `${COLORS.success}22`
                                  : COLORS.surface,
                                color: q.correctIndex === aIdx ? COLORS.success : COLORS.textMuted,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {String.fromCharCode(65 + aIdx)}
                            </button>
                            <input
                              type="text"
                              value={answer}
                              onChange={(e) => {
                                const newQuestions = [...mcForm.questions];
                                const newAnswers = [...newQuestions[qIdx].answers] as [string, string, string, string];
                                newAnswers[aIdx] = e.target.value;
                                newQuestions[qIdx] = { ...newQuestions[qIdx], answers: newAnswers };
                                setMcForm({ ...mcForm, questions: newQuestions });
                              }}
                              required
                              placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                              style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: '13px' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add Question Button */}
                  <button
                    type="button"
                    onClick={() => setMcForm({
                      ...mcForm,
                      questions: [...mcForm.questions, { question: '', answers: ['', '', '', ''], correctIndex: 0 }]
                    })}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: COLORS.surface,
                      border: `2px dashed ${COLORS.border}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent;
                      e.currentTarget.style.background = `${COLORS.accent}11`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.border;
                      e.currentTarget.style.background = COLORS.surface;
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Settings Row */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Độ khó</label>
                  <select
                    value={mcForm.difficulty}
                    onChange={(e) => setMcForm({ ...mcForm, difficulty: e.target.value as any })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Thời gian (giây)</label>
                  <input
                    type="number"
                    value={mcForm.timeLimit}
                    onChange={(e) => setMcForm({ ...mcForm, timeLimit: parseInt(e.target.value) || 60 })}
                    min={10}
                    max={3600}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                style={{
                  background: creating ? COLORS.surfaceHigh : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  color: creating ? COLORS.textDim : '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                }}
              >
                {creating ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Đang tạo...
                  </>
                ) : (
                  `Tạo bài trắc nghiệm (${mcForm.questions.length} câu)`
                )}
              </button>
            </form>
          ) : (
            // Code Form
            <form onSubmit={editingId ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Tiêu đề *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Ví dụ: Two Sum"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Đề bài *</label>
              <RichTextEditor
                content={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                onImageUpload={handleImageUpload}
                placeholder="Nhập đề bài chi tiết..."
                minHeight="150px"
              />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Độ khó</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Thời gian (phút)</label>
                <input
                  type="number"
                  value={Math.floor((form.time_limit ?? 300) / 60)}
                  onChange={(e) => setForm({ ...form, time_limit: (parseInt(e.target.value) || 5) * 60 })}
                  min={1}
                  max={60}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Hẹn giờ mở (để trống = mở ngay)</label>
              <input
                type="text"
                value={codeScheduleTime}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9:]/g, '');
                  if (v.length === 2 && !v.includes(':')) v += ':';
                  if (v.length > 5) v = v.slice(0, 5);
                  setCodeScheduleTime(v);
                }}
                onBlur={() => {
                  if (!codeScheduleTime || !/^\d{2}:\d{2}$/.test(codeScheduleTime)) {
                    setForm({ ...form, start_time: undefined });
                    return;
                  }
                  const [hours, minutes] = codeScheduleTime.split(':').map(Number);
                  if (hours > 23 || minutes > 59) return;
                  const now = new Date();
                  const scheduled = new Date();
                  scheduled.setHours(hours, minutes, 0, 0);
                  if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
                  setForm({ ...form, start_time: scheduled.toISOString() });
                }}
                placeholder="VD: 14:30"
                maxLength={5}
                style={{ ...inputStyle, width: '100px', textAlign: 'center' }}
              />
              {codeScheduleTime && /^\d{2}:\d{2}$/.test(codeScheduleTime) && (
                <span style={{ marginLeft: '12px', color: COLORS.textMuted, fontSize: '13px' }}>
                  Sẽ mở lúc {codeScheduleTime} {(() => {
                    const [h, m] = codeScheduleTime.split(':').map(Number);
                    if (h > 23 || m > 59) return '(giờ không hợp lệ)';
                    const now = new Date();
                    const scheduled = new Date();
                    scheduled.setHours(h, m, 0, 0);
                    return scheduled <= now ? 'ngày mai' : 'hôm nay';
                  })()}
                </span>
              )}
            </div>
            <div>
              <label style={labelStyle}>Ngôn ngữ</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleToggleLang(l.id)}
                    style={{
                      background: form.language.includes(l.id) ? COLORS.primary : COLORS.surface,
                      border: `1px solid ${form.language.includes(l.id) ? COLORS.primary : COLORS.border}`,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      color: form.language.includes(l.id) ? '#000' : COLORS.textMuted,
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Code khởi tạo</label>
              <textarea
                value={form.starter_code}
                onChange={(e) => setForm({ ...form, starter_code: e.target.value })}
                rows={3}
                placeholder="# Code mẫu (tùy chọn)"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
              />
            </div>

            {/* Test cases */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Test Cases
                  <span style={{
                    marginLeft: '6px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: COLORS.surfaceHigh,
                    fontSize: '10px',
                    color: COLORS.textDim,
                  }}>
                    {testCases.length}
                  </span>
                </label>
              </div>
              {testCases.map((tc, i) => (
                <div
                  key={i}
                  style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.borderDim}`,
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: COLORS.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: COLORS.surfaceHigh,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}>
                        {i + 1}
                      </span>
                      Test case
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: tc.is_hidden ? COLORS.warning : COLORS.textDim,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: tc.is_hidden ? `${COLORS.warning}22` : 'transparent',
                      }}>
                        <input
                          type="checkbox"
                          checked={tc.is_hidden}
                          onChange={(e) => updateTestCase(i, 'is_hidden', e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: COLORS.warning }}
                        />
                        Ẩn
                      </label>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(i)}
                          style={{
                            background: COLORS.surfaceHigh,
                            border: 'none',
                            borderRadius: '6px',
                            width: '24px',
                            height: '24px',
                            color: COLORS.textDim,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', color: COLORS.textDim, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                      rows={2}
                      placeholder="2 7 11 15&#10;9"
                      style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: COLORS.textDim, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</label>
                    <textarea
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                      rows={2}
                      placeholder="[0, 1]"
                      style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ))}

              {/* Add Test Case Button */}
              <button
                type="button"
                onClick={addTestCase}
                style={{
                  width: '100%',
                  height: '44px',
                  background: COLORS.surface,
                  border: `2px dashed ${COLORS.border}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.background = `${COLORS.primary}11`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.background = COLORS.surface;
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                background: creating
                  ? COLORS.surfaceHigh
                  : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
                border: 'none',
                borderRadius: '12px',
                padding: '14px 24px',
                color: creating ? COLORS.textDim : '#000',
                fontSize: '14px',
                fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              {creating ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  {editingId ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  {editingId ? 'Lưu thay đổi' : 'Tạo bài tập'}
                </>
              )}
            </button>
          </form>
          )}
            </div>
          </div>
        </div>
      )}

      {/* Screen: Select Type */}
      {screen === 'select-type' && (
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setScreen('list')}
              style={{
                background: COLORS.surfaceHigh,
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                color: COLORS.textMuted,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: COLORS.text }}>Chọn loại bài tập</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => handleSelectType('code')} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderDim}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${COLORS.primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>
              </div>
              <div><div style={{ color: COLORS.text, fontWeight: 600, fontSize: '14px' }}>Bài tập Code</div><div style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '2px' }}>Viết code với test cases</div></div>
            </button>
            <button onClick={() => handleSelectType('multiple_choice')} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderDim}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${COLORS.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div><div style={{ color: COLORS.text, fontWeight: 600, fontSize: '14px' }}>Trắc nghiệm</div><div style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '2px' }}>Nhiều câu hỏi với 4 đáp án</div></div>
            </button>
            <button onClick={() => handleSelectType('essay')} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderDim}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${COLORS.primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div><div style={{ color: COLORS.text, fontWeight: 600, fontSize: '14px' }}>Tự luận</div><div style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '2px' }}>Câu hỏi mở, học sinh tự viết</div></div>
            </button>
          </div>
        </div>
      )}

      {/* Screen: Assignment List */}
      {screen === 'list' && (
        <>
      {/* Assignment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: `2px solid ${COLORS.borderDim}`,
              borderTopColor: COLORS.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : (
          all.map((a) => {
            const isScheduledNotStarted = a.is_published && a.start_time && new Date(a.start_time) > new Date();
            return (
            <div
              key={a.id}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.borderDim}`,
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '10px',
                opacity: isScheduledNotStarted ? 0.5 : 1,
                filter: isScheduledNotStarted ? 'grayscale(100%)' : 'none',
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              {/* Header row: title + menu */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    margin: '0 0 6px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.text,
                    lineHeight: 1.3,
                  }}>
                    {a.title}
                  </h4>
                  {/* Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${DIFFICULTY_COLORS[a.difficulty]}20`,
                        color: DIFFICULTY_COLORS[a.difficulty],
                      }}
                    >
                      {a.difficulty === 'easy' ? 'Easy' : a.difficulty === 'medium' ? 'Medium' : 'Hard'}
                    </span>
                    {a.is_published && (
                      <>
                        {a.start_time && new Date(a.start_time) > new Date() ? (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#ffb020',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Mở lúc {new Date(a.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: COLORS.success,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: COLORS.success,
                            }} />
                            Đang mở
                          </span>
                        )}
                        {submissionCounts[a.id] !== undefined && (
                          <button
                            onClick={() => handleViewSubmissions(a)}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(59,130,246,0.15)',
                              color: '#3b82f6',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            </svg>
                            {submissionCounts[a.id]} bài nộp
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Menu button */}
                <button
                  onClick={() => {/* toggle menu */}}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textMuted,
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.surfaceHigh;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
              </div>

              {/* Footer: info + actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: COLORS.textDim }}>
                  {a.language.length > 0 && (
                    <span>{a.language.join(', ')}</span>
                  )}
                  {a.language.length > 0 && a.time_limit > 0 && <span>·</span>}
                  {a.time_limit > 0 && (
                    <span>{Math.floor(a.time_limit / 60)} phút</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleEdit(a)}
                    title="Sửa"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: COLORS.textMuted,
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '11px',
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(a.id)}
                    title="Xóa"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: COLORS.textDim,
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '11px',
                    }}
                  >
                    Xóa
                  </button>
                  {!a.is_published && (
                    <button
                      onClick={() => handlePublishAssignment(a)}
                      style={{
                        background: COLORS.primary,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Gửi
                    </button>
                  )}
                </div>
              </div>
            </div>
          );})
        )}
      </div>

      {/* Add new button - Bottom */}
      <div style={{ padding: '20px', flexShrink: 0, borderTop: `1px solid ${COLORS.borderDim}` }}>
        <button
          onClick={() => setScreen('select-type')}
          style={{
            width: '100%',
            background: `linear-gradient(135deg, ${COLORS.primary}15 0%, ${COLORS.accent}15 100%)`,
            border: `2px dashed ${COLORS.primary}50`,
            borderRadius: '16px',
            padding: '28px 20px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.primary;
            e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.primary}25 0%, ${COLORS.accent}25 100%)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${COLORS.primary}50`;
            e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.primary}15 0%, ${COLORS.accent}15 100%)`;
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.accent}30 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text, marginBottom: '4px' }}>
              Thêm bài tập mới
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
              Code hoặc trắc nghiệm
            </div>
          </div>
        </button>
      </div>
        </>
      )}

      {/* Submissions Viewer Modal */}
      {viewingSubmissions && (
        <div
          onClick={() => { setViewingSubmissions(null); setSelectedSubmission(null); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              borderRadius: '16px',
              width: '90vw',
              maxWidth: '900px',
              height: '80vh',
              display: 'flex',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Left: Submission list */}
            <div style={{
              width: '320px',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {viewingSubmissions.title}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: COLORS.textDim }}>
                  {submissions.length} bài nộp
                </p>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {loadingSubmissions ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: COLORS.textDim }}>
                    Đang tải...
                  </div>
                ) : submissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: COLORS.textDim }}>
                    Chưa có bài nộp nào
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      style={{
                        width: '100%',
                        background: selectedSubmission?.id === sub.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                        border: selectedSubmission?.id === sub.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {sub.user?.username || 'Học viên'}
                        </span>
                        {sub.score !== undefined && sub.score > 0 && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: sub.score >= 80 ? 'rgba(0,200,100,0.15)' : sub.score >= 50 ? 'rgba(255,176,32,0.15)' : 'rgba(255,99,82,0.15)',
                            color: sub.score >= 80 ? '#00c864' : sub.score >= 50 ? '#ffb020' : '#ff6352',
                          }}>
                            {sub.score}đ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textDim }}>
                        {sub.language === 'text' ? 'Tự luận' : sub.language} • {new Date(sub.created_at).toLocaleString('vi-VN')}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => { setViewingSubmissions(null); setSelectedSubmission(null); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Right: Submission detail */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111' }}>
              {selectedSubmission ? (
                <>
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {selectedSubmission.user?.username || 'Học viên'}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: COLORS.textDim }}>
                        Nộp lúc {new Date(selectedSubmission.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3b82f6',
                        fontWeight: 600,
                      }}>
                        {selectedSubmission.language === 'text' ? 'Tự luận' : selectedSubmission.language}
                      </span>
                      {selectedSubmission.score !== undefined && selectedSubmission.score > 0 && (
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: selectedSubmission.score >= 80 ? 'rgba(0,200,100,0.15)' : selectedSubmission.score >= 50 ? 'rgba(255,176,32,0.15)' : 'rgba(255,99,82,0.15)',
                          color: selectedSubmission.score >= 80 ? '#00c864' : selectedSubmission.score >= 50 ? '#ffb020' : '#ff6352',
                        }}>
                          {selectedSubmission.score} điểm
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                    {selectedSubmission.language === 'text' ? (
                      <div style={{
                        padding: '16px',
                        background: '#0a0a0a',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <RichTextViewer content={selectedSubmission.code} />
                      </div>
                    ) : selectedSubmission.language === 'json' ? (
                      // Multiple Choice Detail View
                      (() => {
                        try {
                          const submissionData = JSON.parse(selectedSubmission.code);
                          const assignmentConfig = JSON.parse(viewingSubmissions?.starter_code || '{}');

                          // Get questions (support both old and new format)
                          let questions = assignmentConfig.questions || [];
                          if (questions.length === 0 && assignmentConfig.answers) {
                            questions = [{
                              question: viewingSubmissions?.description || '',
                              answers: assignmentConfig.answers,
                              correctIndex: assignmentConfig.correctIndex,
                            }];
                          }

                          const studentAnswers = submissionData.answers || [];

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Score Summary */}
                              <div style={{
                                padding: '12px 16px',
                                background: submissionData.score >= 80 ? 'rgba(0,200,100,0.1)' : submissionData.score >= 50 ? 'rgba(255,176,32,0.1)' : 'rgba(255,99,82,0.1)',
                                borderRadius: '10px',
                                border: `1px solid ${submissionData.score >= 80 ? 'rgba(0,200,100,0.3)' : submissionData.score >= 50 ? 'rgba(255,176,32,0.3)' : 'rgba(255,99,82,0.3)'}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}>
                                <span style={{ fontSize: '14px', color: COLORS.text }}>
                                  Đúng {submissionData.correct}/{submissionData.total} câu
                                </span>
                                <span style={{
                                  fontSize: '18px',
                                  fontWeight: 700,
                                  color: submissionData.score >= 80 ? '#00c864' : submissionData.score >= 50 ? '#ffb020' : '#ff6352',
                                }}>
                                  {submissionData.score} điểm
                                </span>
                              </div>

                              {/* Questions Detail */}
                              {questions.map((q: any, qIdx: number) => {
                                const studentAnswer = studentAnswers[qIdx];
                                const isCorrect = studentAnswer === q.correctIndex;

                                return (
                                  <div key={qIdx} style={{
                                    padding: '14px',
                                    background: '#0a0a0a',
                                    borderRadius: '10px',
                                    border: `1px solid ${isCorrect ? 'rgba(0,200,100,0.3)' : 'rgba(255,99,82,0.3)'}`,
                                  }}>
                                    {/* Question Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                      <span style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        background: isCorrect ? '#00c864' : '#ff6352',
                                        color: '#000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                      }}>
                                        {qIdx + 1}
                                      </span>
                                      <div style={{ flex: 1, fontSize: '13px', color: COLORS.text }}>
                                        <RichTextViewer content={q.question} />
                                      </div>
                                      {isCorrect ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c864" strokeWidth="2.5">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6352" strokeWidth="2.5">
                                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                      )}
                                    </div>

                                    {/* Answer Options */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '34px' }}>
                                      {q.answers.map((answer: string, aIdx: number) => {
                                        const isStudentChoice = studentAnswer === aIdx;
                                        const isCorrectAnswer = q.correctIndex === aIdx;

                                        return (
                                          <div key={aIdx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: isCorrectAnswer
                                              ? 'rgba(0,200,100,0.15)'
                                              : isStudentChoice
                                              ? 'rgba(255,99,82,0.15)'
                                              : 'rgba(255,255,255,0.03)',
                                            border: isCorrectAnswer
                                              ? '1px solid rgba(0,200,100,0.4)'
                                              : isStudentChoice
                                              ? '1px solid rgba(255,99,82,0.4)'
                                              : '1px solid transparent',
                                          }}>
                                            <span style={{
                                              width: '20px',
                                              height: '20px',
                                              borderRadius: '4px',
                                              background: isCorrectAnswer ? '#00c864' : isStudentChoice ? '#ff6352' : 'rgba(255,255,255,0.1)',
                                              color: isCorrectAnswer || isStudentChoice ? '#000' : COLORS.textMuted,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '11px',
                                              fontWeight: 700,
                                            }}>
                                              {String.fromCharCode(65 + aIdx)}
                                            </span>
                                            <span style={{
                                              flex: 1,
                                              fontSize: '13px',
                                              color: isCorrectAnswer ? '#00c864' : isStudentChoice ? '#ff6352' : COLORS.text,
                                            }}>
                                              {answer}
                                            </span>
                                            {isStudentChoice && !isCorrectAnswer && (
                                              <span style={{ fontSize: '11px', color: '#ff6352' }}>Đã chọn</span>
                                            )}
                                            {isCorrectAnswer && (
                                              <span style={{ fontSize: '11px', color: '#00c864' }}>Đáp án đúng</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } catch {
                          return <pre style={{ color: COLORS.textMuted }}>{selectedSubmission.code}</pre>;
                        }
                      })()
                    ) : (
                      <pre style={{
                        margin: 0,
                        padding: '16px',
                        background: '#0a0a0a',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '13px',
                        fontFamily: 'Monaco, Consolas, monospace',
                        color: '#e0e0e0',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                      }}>
                        {selectedSubmission.code}
                      </pre>
                    )}
                  </div>
                </>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textDim,
                  fontSize: '13px',
                }}>
                  Chọn bài nộp để xem chi tiết
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        input:focus, textarea:focus, select:focus {
          border-color: ${COLORS.primary} !important;
          box-shadow: 0 0 0 3px ${COLORS.primary}20 !important;
        }
        input::placeholder, textarea::placeholder {
          color: ${COLORS.textDim};
        }
      `}</style>
    </DraggableExercisePanel>

    {/* Xác nhận xóa bài tập (M-12) — overlay dark theo màu COLORS của phòng học */}
    {confirmDeleteId && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: (zIndex ?? 200) + 100,
        }}
        onClick={() => setConfirmDeleteId(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa bài tập"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '20px',
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <p style={{ color: COLORS.text, fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Xóa bài tập này?
          </p>
          <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '16px' }}>
            Hành động này không thể hoàn tác.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setConfirmDeleteId(null)}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted,
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              style={{
                background: COLORS.danger,
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Xóa bài tập
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// Draggable wrapper component for floating panel
function DraggableExercisePanel({
  children,
  position,
  onPositionChange,
  zIndex = 200,
  onFocus,
}: {
  children: React.ReactNode;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus?.(); // Bring to front when clicked
    // Only allow dragging from header area
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a')) return;
    if (!target.closest('[data-drag-handle]')) return;

    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 480, e.clientX - offset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.y));
      onPositionChange({ x: newX, y: newY });
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset, onPositionChange]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={onFocus}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '480px',
        maxHeight: '80vh',
        background: COLORS.bg,
        borderRadius: '20px',
        border: `1px solid ${COLORS.borderDim}`,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'default',
      }}
    >
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: COLORS.text,
  marginBottom: '8px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '12px 16px',
  color: COLORS.text,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/meet/api';
import type { Assignment, TestCase, SandboxResponse, SubmissionResult } from '@/lib/meet/types-assignment';
import RichTextEditor, { RichTextViewer } from '@/components/meet/RichTextEditor';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript' },
  { id: 'go', label: 'Go', monaco: 'go' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
  { id: 'c', label: 'C', monaco: 'c' },
  { id: 'java', label: 'Java', monaco: 'java' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#00c864',
  medium: '#ffb020',
  hard: '#ff6352',
};

interface Props {
  assignmentId: string;
  title: string;
  userId: string;
  isHost?: boolean;
  onClose: (wasSubmitted?: boolean) => void;
}

export default function AssignmentWorkOverlay({ assignmentId, title, userId, isHost = false, onClose }: Props) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [sampleTests, setSampleTests] = useState<TestCase[]>([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmissionResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'output' | 'tests'>('output');
  const [sidebarTab, setSidebarTab] = useState<'problem' | 'samples'>('problem');
  const [essayAnswer, setEssayAnswer] = useState('');
  const [mcAnswers, setMcAnswers] = useState<number[]>([]); // Selected answer index for each question
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mySubmission, setMySubmission] = useState<any>(null);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);
  const [customInput, setCustomInput] = useState(''); // Input để test thử
  const [timeStatus, setTimeStatus] = useState<'waiting' | 'active'>('active');
  const [countdown, setCountdown] = useState('');

  // Check time status (waiting for start_time, active)
  // Note: We don't auto-expire assignments - schedule time is just for opening
  // Host can always access (to preview)
  useEffect(() => {
    if (!assignment) return;

    // Host can always access
    if (isHost) {
      setTimeStatus('active');
      setCountdown('');
      return;
    }

    const checkTime = () => {
      const now = new Date();

      // Check if before start_time - show waiting screen for students
      if (assignment.start_time) {
        const startTime = new Date(assignment.start_time);

        if (now < startTime) {
          setTimeStatus('waiting');
          const diff = startTime.getTime() - now.getTime();
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
          return;
        }
      }

      // Start time has passed or no start_time - assignment is active
      setTimeStatus('active');
      setCountdown('');
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [assignment, isHost]);

  const handleRequestClose = useCallback(() => {
    if (mySubmission) {
      onClose(true);
    } else {
      setShowExitConfirm(true);
    }
  }, [mySubmission, onClose]);

  // Detect assignment type from starter_code or code state
  const assignmentType = useMemo((): 'code' | 'essay' | 'multiple_choice' => {
    // Try assignment.starter_code first, then code state
    const starterCode = assignment?.starter_code ?? code;
    if (!starterCode) return 'code';

    // Quick check for JSON structure before parsing
    const trimmed = starterCode.trim();
    if (!trimmed.startsWith('{')) return 'code';

    try {
      const parsed = JSON.parse(trimmed);
      console.log('[AssignmentType] parsed:', parsed.type);
      if (parsed.type === 'essay') return 'essay';
      if (parsed.type === 'multiple_choice') return 'multiple_choice';
    } catch (e) {
      console.log('[AssignmentType] parse error:', e);
    }
    return 'code';
  }, [assignment?.starter_code, code]);

  // Parse essay config
  const essayConfig = useMemo(() => {
    if (assignmentType !== 'essay') return null;
    try {
      const starterCode = assignment?.starter_code || code;
      return JSON.parse(starterCode || '{}');
    } catch {
      return { minWords: 50, maxWords: 500 };
    }
  }, [assignment, assignmentType, code]);

  // Parse multiple choice config
  const mcConfig = useMemo(() => {
    console.log('[mcConfig] assignmentType:', assignmentType);
    if (assignmentType !== 'multiple_choice') return null;
    try {
      const starterCode = assignment?.starter_code ?? code;
      const parsed = JSON.parse(starterCode || '{}');
      console.log('[mcConfig] parsed:', parsed);
      // Support both old format (single question) and new format (multiple questions)
      if (parsed.questions) {
        return { questions: parsed.questions };
      } else if (parsed.answers) {
        // Old format: convert to new format
        return {
          questions: [{
            question: assignment?.description || '',
            answers: parsed.answers,
            correctIndex: parsed.correctIndex,
          }]
        };
      }
      return null;
    } catch (e) {
      console.log('[mcConfig] error:', e);
      return null;
    }
  }, [assignment, assignmentType, code]);

  // Initialize mcAnswers when mcConfig changes
  useEffect(() => {
    if (mcConfig?.questions) {
      setMcAnswers(new Array(mcConfig.questions.length).fill(-1));
    }
  }, [mcConfig]);

  // Count words in essay (strip HTML tags first)
  const wordCount = useMemo(() => {
    const textOnly = essayAnswer.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    return textOnly.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [essayAnswer]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<SandboxResponse>(`/assignments/${assignmentId}/sandbox`);
        setAssignment(res.assignment);
        setSampleTests(res.sample_tests ?? []);
        setLanguage(res.assignment.language?.[0] ?? 'python');
        setCode(res.assignment.starter_code ?? '');
      } catch {
        try {
          const a = await api.get<{ data: Assignment }>(`/assignments/${assignmentId}`);
          setAssignment(a.data);
          setCode(a.data.starter_code ?? '');
          setLanguage(a.data.language?.[0] ?? 'python');
        } catch {}
      } finally {
        setLoading(false);
      }

      // Fetch existing submission
      try {
        const subRes = await api.get<{ data: any[] }>(`/submissions/my/${assignmentId}?user_id=${userId}`);
        if (subRes.data && subRes.data.length > 0) {
          const latestSub = subRes.data[0];
          setMySubmission(latestSub);
          // Load submitted code/answer
          if (latestSub.code) {
            if (latestSub.language === 'text') {
              setEssayAnswer(latestSub.code);
            } else {
              setCode(latestSub.code);
              setLanguage(latestSub.language);
            }
          }
        }
      } catch (err) {
        console.log('No existing submission');
      }
    }
    load();
  }, [assignmentId, userId]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResults(null);
    setActiveResultTab('output');
    try {
      const res = await api.post<SubmissionResult>('/submissions/run-custom', {
        assignment_id: assignmentId,
        user_id: userId,
        language,
        code,
        custom_input: customInput,
      });
      setResults(res as any);
    } catch (err: any) {
      setResults({ error: err.message ?? 'Lỗi khi chạy code' } as any);
    } finally {
      setRunning(false);
    }
  }, [assignmentId, code, language, customInput]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setResults(null);
    try {
      const res = await api.post<SubmissionResult>('/submissions', {
        assignment_id: assignmentId,
        user_id: userId,
        language,
        code,
      });
      setResults(res as any);
      setMySubmission(res);
      setActiveResultTab('tests');
    } catch (err: any) {
      setResults({ error: err.message ?? 'Lỗi khi nộp bài' } as any);
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, userId, code, language]);

  // Handle image upload for essay editor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.upload<{ url: string }>('/upload', formData);
    return res.url;
  }, []);

  const handleSubmitEssay = useCallback(async () => {
    if (!essayAnswer.trim()) {
      setAlertModal({ title: 'Thiếu nội dung', message: 'Vui lòng nhập câu trả lời của bạn.' });
      return;
    }
    if (essayConfig?.minWords && wordCount < essayConfig.minWords) {
      setAlertModal({
        title: 'Chưa đủ số từ',
        message: `Câu trả lời cần tối thiểu ${essayConfig.minWords} từ. Hiện tại bạn mới viết ${wordCount} từ.`
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/submissions', {
        assignment_id: assignmentId,
        user_id: userId,
        language: 'text',
        code: essayAnswer,
      });
      setMySubmission(res);
    } catch (err: any) {
      setAlertModal({ title: 'Lỗi', message: err.message ?? 'Lỗi khi nộp bài' });
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, userId, essayAnswer, essayConfig, wordCount]);

  // Handle multiple choice submission
  const handleSubmitMC = useCallback(async () => {
    if (!mcConfig?.questions) return;

    // Check if all questions are answered
    const unanswered = mcAnswers.findIndex(a => a === -1);
    if (unanswered !== -1) {
      setAlertModal({
        title: 'Chưa trả lời hết',
        message: `Vui lòng trả lời câu ${unanswered + 1} trước khi nộp bài.`
      });
      return;
    }

    setSubmitting(true);
    try {
      // Send only answers to backend - backend will calculate score
      const res = await api.post<any>('/submissions', {
        assignment_id: assignmentId,
        user_id: userId,
        language: 'json',
        code: JSON.stringify({ answers: mcAnswers }),
      });

      // Wait a bit for backend to process and calculate score
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the updated submission to get the score
      const subRes = await api.get<{ data: any[] }>(`/submissions/my/${assignmentId}?user_id=${userId}`);
      if (subRes.data && subRes.data.length > 0) {
        const latestSub = subRes.data[0];
        try {
          const resultData = JSON.parse(latestSub.code);
          setMySubmission({ score: resultData.score });
        } catch {
          setMySubmission({ score: latestSub.test_cases_passed * 100 / (latestSub.total_test_cases || 1) });
        }
      }
    } catch (err: any) {
      setAlertModal({ title: 'Lỗi', message: err.message ?? 'Lỗi khi nộp bài' });
    } finally {
      setSubmitting(false);
    }
  }, [assignmentId, userId, mcConfig, mcAnswers]);

  const handleLangChange = (langId: string) => {
    setLanguage(langId);
  };

  const passedCount = results?.test_results?.filter((t) => t.passed).length ?? 0;
  const totalCount = results?.test_results?.length ?? 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}
    onClick={handleRequestClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Waiting overlay - before start_time */}
      {timeStatus === 'waiting' && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#121212',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255,176,32,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffb020" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            Chờ mở bài
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Bài tập sẽ mở sau
          </p>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            fontFamily: 'Monaco, Consolas, monospace',
            color: '#ffb020',
          }}>
            {countdown}
          </div>
        </div>
      )}

      {/* Modal container - only show when active */}
      {timeStatus === 'active' && (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
        background: '#121212',
        borderRadius: '12px',
        width: '90vw',
        maxWidth: '1100px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
      {/* Header */}
      <header style={{
        background: 'rgba(20,20,20,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 1rem',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        gap: '0.75rem',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</span>
          {assignment && (
            <span style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.1rem 0.4rem',
              borderRadius: '3px',
              background: `${DIFFICULTY_COLORS[assignment.difficulty] ?? '#888'}22`,
              color: DIFFICULTY_COLORS[assignment.difficulty] ?? '#888',
            }}>
              {assignment.difficulty}
            </span>
          )}
        </div>

        {mySubmission && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: '#00c864',
              background: 'rgba(0,200,100,0.1)',
              borderRadius: '4px',
              padding: '0.2rem 0.5rem',
              fontWeight: 600,
            }}>
              Đã nộp
            </div>
            {mySubmission?.score !== undefined && (
              <div style={{
                fontSize: '0.7rem',
                color: mySubmission.score >= 80 ? '#00c864' : mySubmission.score >= 50 ? '#ffb020' : '#ff6352',
                background: mySubmission.score >= 80 ? 'rgba(0,200,100,0.1)' : mySubmission.score >= 50 ? 'rgba(255,176,32,0.1)' : 'rgba(255,99,82,0.1)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontWeight: 700,
              }}>
                {mySubmission.score}đ
              </div>
            )}
          </div>
        )}

        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          {assignmentType === 'essay' ? 'Tự luận' : assignmentType === 'multiple_choice' ? 'Trắc nghiệm' : assignment?.language?.join(', ')}
        </div>

        {/* Countdown timer */}
        {countdown && assignment?.start_time && assignment?.time_limit && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.3rem 0.7rem',
            borderRadius: '6px',
            background: 'rgba(255,176,32,0.15)',
            border: '1px solid rgba(255,176,32,0.3)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffb020" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'Monaco, Consolas, monospace',
              color: '#ffb020',
            }}>
              {countdown}
            </span>
          </div>
        )}

        <button
          onClick={handleRequestClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            padding: '0.35rem 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248,113,113,0.15)';
            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Thoát
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {assignmentType === 'essay' ? (
          /* Essay Layout: Question left, Answer right */
          <>
            {/* Left: Question */}
            <div style={{
              width: '45%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,15,15,0.8)',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#f87171',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>Đề bài</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
                {loading ? (
                  <div style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '2rem' }}>
                    Đang tải...
                  </div>
                ) : assignment ? (
                  <div>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4 }}>
                      {assignment.title}
                    </h2>
                    <RichTextViewer content={assignment.description || ''} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Answer */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,15,15,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>Câu trả lời</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: wordCount < (essayConfig?.minWords || 0) ? '#ff6352' :
                           wordCount > (essayConfig?.maxWords || 999) ? '#ffb020' : '#00c864',
                  }}>
                    {wordCount} / {essayConfig?.minWords || 0}-{essayConfig?.maxWords || 500} từ
                  </span>
                  <button
                    onClick={handleSubmitEssay}
                    disabled={submitting}
                    style={{
                      background: submitting ? 'rgba(255,99,82,0.4)' : '#ff6352',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem 1.25rem',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Đang nộp...' : 'Nộp bài'}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <RichTextEditor
                    content={essayAnswer}
                    onChange={setEssayAnswer}
                    onImageUpload={handleImageUpload}
                    placeholder="Nhập câu trả lời của bạn..."
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </>
        ) : assignmentType === 'multiple_choice' ? (
          /* Multiple Choice Layout */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header with title and submit */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(15,15,15,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{assignment?.title}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  {mcConfig?.questions?.length || 0} câu hỏi
                  {mySubmission?.score !== undefined && (
                    <span style={{
                      marginLeft: '12px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: mySubmission.score >= 80 ? 'rgba(0,200,100,0.15)' : mySubmission.score >= 50 ? 'rgba(255,176,32,0.15)' : 'rgba(255,99,82,0.15)',
                      color: mySubmission.score >= 80 ? '#00c864' : mySubmission.score >= 50 ? '#ffb020' : '#ff6352',
                      fontWeight: 700,
                    }}>
                      Điểm: {mySubmission.score}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleSubmitMC}
                disabled={submitting}
                style={{
                  background: submitting ? 'rgba(255,99,82,0.4)' : '#ff6352',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>

            {/* Questions List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '2rem' }}>
                  Đang tải...
                </div>
              ) : mcConfig?.questions?.map((q: any, qIdx: number) => (
                <div key={qIdx} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {/* Question Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '1rem',
                  }}>
                    <span style={{
                      background: '#ff8e80',
                      color: '#000',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {qIdx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <RichTextViewer content={q.question} />
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '40px' }}>
                    {q.answers.map((answer: string, aIdx: number) => {
                      const isSelected = mcAnswers[qIdx] === aIdx;
                      const isCorrect = mySubmission && q.correctIndex === aIdx;
                      const isWrong = mySubmission && isSelected && q.correctIndex !== aIdx;

                      return (
                        <button
                          key={aIdx}
                          onClick={() => {
                            const newAnswers = [...mcAnswers];
                            newAnswers[qIdx] = aIdx;
                            setMcAnswers(newAnswers);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: isCorrect
                              ? 'rgba(0,200,100,0.15)'
                              : isWrong
                              ? 'rgba(255,99,82,0.15)'
                              : isSelected
                              ? 'rgba(255,142,128,0.15)'
                              : 'rgba(255,255,255,0.04)',
                            border: isCorrect
                              ? '1px solid rgba(0,200,100,0.4)'
                              : isWrong
                              ? '1px solid rgba(255,99,82,0.4)'
                              : isSelected
                              ? '1px solid rgba(255,142,128,0.4)'
                              : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isCorrect
                              ? '#00c864'
                              : isWrong
                              ? '#ff6352'
                              : isSelected
                              ? '#ff8e80'
                              : 'rgba(255,255,255,0.1)',
                            color: isSelected || isCorrect || isWrong ? '#000' : 'rgba(255,255,255,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {String.fromCharCode(65 + aIdx)}
                          </span>
                          <span style={{
                            flex: 1,
                            fontSize: '0.9rem',
                            color: isCorrect
                              ? '#00c864'
                              : isWrong
                              ? '#ff6352'
                              : isSelected
                              ? '#ff8e80'
                              : 'rgba(255,255,255,0.85)',
                          }}>
                            {answer}
                          </span>
                          {isCorrect && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c864" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                          {isWrong && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6352" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Code Layout: Editor left, Description+Tests right */
          <>
        {/* Left: Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            background: 'rgba(20,20,20,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0.6rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0,
          }}>
            <select
              value={language}
              onChange={(e) => handleLangChange(e.target.value)}
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {LANGUAGES.filter((l) => !assignment?.language || assignment.language.includes(l.id)).map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>

            <button
              onClick={handleRun}
              disabled={running || submitting}
              style={{
                background: running ? 'rgba(255,99,82,0.3)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '0.4rem 1rem',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {running ? 'Đang chạy...' : 'Chạy thử'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || running}
              style={{
                background: submitting ? 'rgba(255,99,82,0.4)' : '#ff6352',
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem 1.25rem',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: submitting || running ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>

            {/* Score badge */}
            {results && !results.error && totalCount > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: passedCount === totalCount ? '#00c864' : passedCount > 0 ? '#ffb020' : '#ff5252',
                  background: passedCount === totalCount ? 'rgba(0,200,100,0.12)' : passedCount > 0 ? 'rgba(255,176,32,0.12)' : 'rgba(255,82,82,0.12)',
                  border: `1px solid ${passedCount === totalCount ? 'rgba(0,200,100,0.25)' : passedCount > 0 ? 'rgba(255,176,32,0.25)' : 'rgba(255,82,82,0.25)'}`,
                  borderRadius: '8px',
                  padding: '0.3rem 0.75rem',
                }}>
                  {passedCount}/{totalCount} passed
                </span>
              </div>
            )}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <MonacoEditor
              height="100%"
              language={LANGUAGES.find((l) => l.id === language)?.monaco ?? 'python'}
              value={code}
              onChange={(val) => setCode(val ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                wordWrap: 'on',
                fontFamily: "'Fira Code', Consolas, monospace",
                fontLigatures: true,
                renderLineHighlight: 'line',
              }}
            />
          </div>

          {/* Results panel */}
          {results && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: '#0d0d0d',
              maxHeight: '220px',
              overflow: 'auto',
              flexShrink: 0,
            }}>
              {/* Result tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 1rem',
                position: 'sticky',
                top: 0,
                background: '#0d0d0d',
              }}>
                {(['output', 'tests'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveResultTab(tab)}
                    disabled={tab === 'tests' && !results.test_results}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeResultTab === tab ? '2px solid #ff6352' : '2px solid transparent',
                      color: activeResultTab === tab ? '#fff' : 'rgba(255,255,255,0.35)',
                      fontSize: '0.75rem',
                      padding: '0.5rem 0.875rem',
                      cursor: tab === 'tests' && !results.test_results ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {tab === 'output' ? 'Output' : 'Test Results'}
                  </button>
                ))}
              </div>

              {/* Result content */}
              <div style={{ padding: '0.75rem 1rem' }}>
                {results.error ? (
                  <pre style={{
                    margin: 0, fontSize: '0.78rem', fontFamily: 'monospace',
                    color: '#ff5252', whiteSpace: 'pre-wrap',
                  }}>{results.error}</pre>
                ) : activeResultTab === 'output' ? (
                  <pre style={{
                    margin: 0, fontSize: '0.78rem', fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  }}>{results.stdout || '(no output)'}</pre>
                ) : (
                  <div>
                    {results.test_results?.map((tc, i) => (
                      <div key={i} style={{
                        background: '#141414',
                        border: `1px solid ${tc.passed ? 'rgba(0,200,100,0.2)' : 'rgba(255,82,82,0.2)'}`,
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem',
                        marginBottom: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800,
                            color: tc.passed ? '#00c864' : '#ff5252',
                          }}>{tc.passed ? 'PASS' : 'FAIL'}</span>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                            Test {i + 1}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                          Input: <code style={{ color: 'rgba(255,255,255,0.6)' }}>{tc.input}</code>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                          Expected: <code style={{ color: '#00c864' }}>{tc.expected}</code>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                          Got: <code style={{ color: tc.passed ? '#00c864' : '#ff5252' }}>{tc.actual}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Description + Tests stacked */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Description panel (top) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            minHeight: 0,
          }}>
            <div style={{
              padding: '0.7rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(15,15,15,0.8)',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#f87171',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>Đề bài</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                  Đang tải...
                </div>
              ) : assignment ? (
                <div>
                  <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 }}>
                    {assignment.title}
                  </h2>
                  <div style={{ fontSize: '0.82rem' }}>
                    <RichTextViewer content={assignment.description || ''} />
                  </div>
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                  Không tải được đề bài
                </div>
              )}
            </div>
          </div>

          {/* Custom Input panel (bottom) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{
              padding: '0.7rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(15,15,15,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#a78bfa',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>Test Input</span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
              }}>Nhập input để test thử</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem' }}>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Nhập input tại đây...&#10;VD:&#10;5&#10;1 2 3 4 5"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '80px',
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
          </>
        )}
      </div>
      </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div
          onClick={() => setShowExitConfirm(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1e1e1e, #161616)',
              borderRadius: '20px',
              padding: '28px',
              width: '360px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(248,113,113,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{
              margin: '0 0 8px',
              fontSize: '17px',
              fontWeight: 700,
              color: '#fff',
            }}>
              Xác nhận thoát
            </h3>
            <p style={{
              margin: '0 0 24px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}>
              Bạn chưa nộp bài. Nếu thoát bây giờ, tiến trình làm bài sẽ không được lưu lại.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
              >
                Tiếp tục làm
              </button>
              <button
                onClick={() => onClose(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 4px 12px rgba(248,113,113,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(248,113,113,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(248,113,113,0.3)';
                }}
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div
          onClick={() => setAlertModal(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1e1e1e, #161616)',
              borderRadius: '20px',
              padding: '28px',
              width: '340px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(251,191,36,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 style={{
              margin: '0 0 8px',
              fontSize: '17px',
              fontWeight: 700,
              color: '#fff',
            }}>
              {alertModal.title}
            </h3>
            <p style={{
              margin: '0 0 24px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}>
              {alertModal.message}
            </p>
            <button
              onClick={() => setAlertModal(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 4px 12px rgba(56,189,248,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(56,189,248,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(56,189,248,0.3)';
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

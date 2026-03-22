export interface Assignment {
  id: string;
  session_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string[];
  starter_code: string;
  time_limit: number;
  memory_limit: number;
  is_published: boolean;
  published_at?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface AssignmentList {
  data: Assignment[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateAssignment {
  session_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string[];
  starter_code?: string;
  time_limit?: number;
  memory_limit?: number;
  start_time?: string;
  end_time?: string;
}

export interface TestCase {
  id: string;
  assignment_id: string;
  input: string;
  expected_output?: string;
  is_hidden: boolean;
  display_order: number;
}

export interface SandboxResponse {
  assignment: Assignment;
  sample_tests: TestCase[];
  last_submission?: SubmissionSnapshot;
}

export interface SubmissionSnapshot {
  id: string;
  language: string;
  code: string;
  verdict: string;
  test_cases_passed: number;
  total_test_cases: number;
  submitted_at: string;
}

export interface SubmissionResult {
  stdout?: string;
  stderr?: string;
  error?: string;
  exit_code?: number;
  test_results?: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
}

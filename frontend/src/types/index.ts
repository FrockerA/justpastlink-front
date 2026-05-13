// Types for JustPastLink

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface Video {
  id: number;
  user_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string;
  duration_seconds: number | null;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export type VideoStatus = 'uploaded' | 'queued' | 'processing' | 'generating_lecture' | 'generating_quiz' | 'completed' | 'failed' | 'error';

export interface ProcessingJob {
  id: number;
  video_id?: number;
  job_type: string;
  status: JobStatus;
  current_stage: ProcessingStage | null;
  correlation_id: string | null;
  task_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  stage_timings: Record<string, ProcessingStageTiming>;
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'pending' | 'queued' | 'processing' | 'generating_lecture' | 'generating_quiz' | 'completed' | 'failed';

export type ProcessingStage = 'download' | 'transcribe' | 'summarize' | 'quiz';

export interface ProcessingStageTiming {
  status?: 'processing' | 'retrying' | 'completed' | 'failed';
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  attempts?: number;
}

export interface Transcript {
  id: number;
  video_id: number;
  full_text: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Lecture {
  id: number;
  video_id: number;
  title: string | null;
  content: string;
  summary: string | null;
  status: LectureStatus;
  created_at: string;
  updated_at: string;
}

export type LectureStatus = 'draft' | 'generated' | 'completed' | 'error';

export interface QuizQuestion {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | string;
  explanation: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type QuizMode = 'practice' | 'exam' | 'flashcards';

export type QuizQuestionLimit = '5' | '10' | '15' | 'all';

export interface QuizAttempt {
  id: string;
  video_id: number;
  completed_at: string;
  mode: QuizMode;
  difficulty: QuizDifficulty;
  question_count: number;
  score: number | null;
  total: number;
  duration_seconds: number;
}

export interface QuizApiResponse {
  id: number;
  video_id: number;
  questions: string;
  created_at: string;
  updated_at: string;
}

export interface QuizResponse {
  id: number;
  video_id: number;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export type VideoUploadResponse = Video;

export interface ProcessingStatusResponse {
  video_id: number;
  video_status: VideoStatus;
  jobs: ProcessingJob[];
  transcript_ready: boolean;
  lecture_ready: boolean;
  quiz_ready: boolean;
  current_stage: ProcessingStage | null;
  stage_index: number;
  stage_count: number;
  progress_percent: number;
  eta_seconds: number | null;
  latest_error_code: string | null;
}

export interface ProcessingDiagnosticsResponse {
  video_id: number;
  video_status: VideoStatus;
  latest_job: ProcessingJob | null;
  jobs: ProcessingJob[];
  stage_order: ProcessingStage[];
  progress_percent: number;
  eta_seconds: number | null;
}

export interface ApiError {
  detail: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface UserUpdateRequest {
  full_name: string | null;
}

export interface EmailUpdateRequest {
  email: string;
  current_password: string;
}

export interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

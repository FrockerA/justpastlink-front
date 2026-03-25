// Types for Video-to-Lecture System

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
  file_size: number;
  mime_type: string;
  duration_seconds: number | null;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export type VideoStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed' | 'error';

export interface ProcessingJob {
  id: number;
  video_id?: number;
  job_type: string;
  status: JobStatus;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'pending' | 'queued' | 'processing' | 'generating_lecture' | 'generating_quiz' | 'completed' | 'failed';

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

export interface VideoUploadResponse extends Video {
  // exact alias to avoid extensive frontend changes
}

export interface ProcessingStatusResponse {
  video_id: number;
  video_status: VideoStatus;
  jobs: ProcessingJob[];
  transcript_ready: boolean;
  lecture_ready: boolean;
  quiz_ready: boolean;
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

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

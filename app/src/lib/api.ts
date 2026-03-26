import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type {
  User,
  Video,
  VideoUploadResponse,
  ProcessingStatusResponse,
  ProcessingJob,
  Transcript,
  Lecture,
  QuizApiResponse,
  QuizResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiError,
} from '@/types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  // Default to same-origin requests (works when FastAPI serves the built frontend).
  // In dev, Vite's `server.proxy` forwards these to the backend.
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    
    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('access_token');
  },
};

// Videos API
export const videosApi = {
  uploadVideo: async (file: File, onProgress?: (progress: number) => void): Promise<VideoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<VideoUploadResponse>('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  getVideos: async (): Promise<Video[]> => {
    const response = await apiClient.get<Video[]>('/videos');
    return response.data;
  },

  getVideo: async (videoId: number): Promise<Video> => {
    const response = await apiClient.get<Video>(`/videos/${videoId}`);
    return response.data;
  },

  deleteVideo: async (videoId: number): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}`);
  },
};

// Processing API
export const processingApi = {
  getStatus: async (videoId: number): Promise<ProcessingStatusResponse> => {
    const response = await apiClient.get<ProcessingStatusResponse>(`/processing/${videoId}/status`);
    return response.data;
  },

  startProcessing: async (videoId: number): Promise<ProcessingJob> => {
    const response = await apiClient.post<ProcessingJob>(`/processing/${videoId}/start`);
    return response.data;
  },
};

// Transcripts API
export const transcriptsApi = {
  getTranscript: async (videoId: number): Promise<Transcript> => {
    const response = await apiClient.get<Transcript>(`/transcripts/${videoId}`);
    return response.data;
  },
};

// Lectures API
export const lecturesApi = {
  getLecture: async (videoId: number): Promise<Lecture> => {
    const response = await apiClient.get<Lecture>(`/lectures/${videoId}`);
    return response.data;
  },

  updateLecture: async (videoId: number, data: Partial<Lecture>): Promise<Lecture> => {
    const response = await apiClient.put<Lecture>(`/lectures/${videoId}`, data);
    return response.data;
  },
};

// Quiz API
export const quizApi = {
  getQuestionsByVideo: async (videoId: number): Promise<QuizResponse> => {
    const response = await apiClient.get<QuizApiResponse>(`/quiz/${videoId}`);

    let parsedQuestions = [];
    try {
      const maybeQuestions = JSON.parse(response.data.questions);
      parsedQuestions = Array.isArray(maybeQuestions) ? maybeQuestions : [];
    } catch {
      parsedQuestions = [];
    }

    return {
      ...response.data,
      questions: parsedQuestions,
    };
  },
};

export default apiClient;

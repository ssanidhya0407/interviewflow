import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

console.log("🚀 API Configuration Loaded:", API_URL);

export const api = axios.create({
    baseURL: API_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        return Promise.reject(error);
    }
);


export interface InterviewConfig {
    role: string;
    experience_level: string;
    topic?: string;
    interview_type?: 'Behavioral' | 'Technical' | 'System Design' | 'Case Study' | 'Mixed';
    interviewer_style?: 'Friendly' | 'Challenging' | 'Technical';
    company?: string;
    language?: string;
    enable_timer?: boolean;
    time_per_question?: number;
    max_questions?: number;
    resume_context?: string;
    job_description?: string;
    enable_panel?: boolean;
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface FeedbackData {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    communication_score: number;
    technical_score: number;
    problem_solving_score: number;
    culture_fit_score: number;
    improvement_tips: string[];
    recommended_resources?: string[];
    voice_metrics?: VoiceMetrics;
    transcript?: Array<{ role: string; content: string }>;
    audio_urls?: Record<string, string>;
}

export interface VoiceMetrics {
    words_per_minute: number;
    filler_word_count: number;
    filler_words_list: string[];
    total_words: number;
    confidence_score: number;
    clarity_score: number;
    pace_rating: string;
    feedback: string[];
}

export interface InterviewRecord {
    session_id: string;
    role: string;
    experience_level: string;
    interview_type: string;
    company?: string;
    score?: number;
    communication_score?: number;
    technical_score?: number;
    problem_solving_score?: number;
    culture_fit_score?: number;
    started_at: string;
    completed_at?: string;
}

export interface DashboardStats {
    total_interviews: number;
    completed_interviews: number;
    average_score: number;
    best_score: number;
    recent_trend: 'improving' | 'declining' | 'stable' | 'neutral';
    category_averages: {
        communication: number;
        technical: number;
        problem_solving: number;
        culture_fit: number;
    };
}

export interface UserSettings {
    theme: 'light' | 'dark';
    language: string;
    enable_timer: boolean;
    time_per_question: number;
    email_reminders: boolean;
    reminder_frequency: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
    theme: "dark",
    language: "en",
    enable_timer: false,
    time_per_question: 120,
    email_reminders: false,
    reminder_frequency: "weekly"
};


export const register = async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', {
        email,
        password,
        full_name: fullName
    });
    return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
};


export const parseResume = async (file: File): Promise<{ parsed: any; context: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/resume/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const parseJobDescription = async (jd: string): Promise<{ parsed: any; context: string }> => {
    const response = await api.post('/api/jd/parse', { job_description: jd });
    return response.data;
};

export const getCompanies = async (): Promise<Record<string, { name: string; interview_style: string; focus_areas: string[] }>> => {
    const response = await api.get('/api/companies');
    return response.data;
};


export const startInterview = async (config: InterviewConfig) => {
    const response = await api.post('/api/interview/start', { config });
    return response.data;
};

export const sendChat = async (sessionId: string, content: string) => {
    const response = await api.post('/api/interview/chat', { session_id: sessionId, content });
    return response.data;
};

export const uploadAudio = async (sessionId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('blob', audioBlob);

    const response = await api.post(`/api/interview/${sessionId}/upload-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getFeedback = async (sessionId: string): Promise<FeedbackData> => {
    const response = await api.post('/api/interview/feedback', { session_id: sessionId });
    return response.data;
};

export const exportPDF = async (sessionId: string): Promise<Blob> => {
    const response = await api.post('/api/interview/export-pdf', { session_id: sessionId }, {
        responseType: 'blob'
    });
    return response.data;
};


export const getInterviews = async (limit: number = 20): Promise<InterviewRecord[]> => {
    const response = await api.get(`/api/dashboard/interviews?limit=${limit}`);
    return response.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
};


export const getSettings = async (): Promise<UserSettings> => {
    try {
        const response = await api.get('/api/settings');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return DEFAULT_USER_SETTINGS;
        }
        throw error;
    }
};

export const updateSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    await api.put('/api/settings', settings);
};


export const setAuthToken = (token: string, user: User) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }
};

export const clearAuth = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export const getStoredUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('token');
    }
    return false;
};


// End of Interview API

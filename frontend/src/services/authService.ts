import api from './api';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'student' | 'staff' | 'admin';
    matric_number?: string;
    staff_id?: string;
    phone?: string;
    department_id?: number;
    preferred_language: string;
    is_active: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    matric_number?: string;
    department_id?: number;
    preferred_language: string;
}

export interface AuthResponse {
    user: User;
    token?: string;
    message: string;
}

const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },

    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.put<User>('/auth/profile', data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('user');
    },

    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    },

    isStaff(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'staff' || user?.role === 'admin';
    },
};

export default authService;

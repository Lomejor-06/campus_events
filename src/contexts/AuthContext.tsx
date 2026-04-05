import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import authService, { type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    isAdmin: () => boolean;
    isStaff: () => boolean;
    isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // Initialize from localStorage immediately to avoid loading flash
    const [user, setUser] = useState<User | null>(() => {
        const cached = localStorage.getItem('user');
        return cached ? JSON.parse(cached) : null;
    });
    const [isLoading, setIsLoading] = useState(true);
    // Flag to suppress onAuthStateChange during explicit register/login
    const suppressAuthChange = useRef(false);

    useEffect(() => {
        const unsubscribe = authService.onAuthChange((user) => {
            // Don't update during explicit login/register operations
            if (suppressAuthChange.current) return;
            setUser(user);
            setIsLoading(false);
        });

        // Safety timeout — never stay loading for more than 3 seconds
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const login = async (credentials: LoginCredentials) => {
        suppressAuthChange.current = true;
        setIsLoading(true);
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
        } finally {
            setIsLoading(false);
            suppressAuthChange.current = false;
        }
    };

    const register = async (data: RegisterData): Promise<AuthResponse> => {
        suppressAuthChange.current = true;
        setIsLoading(true);
        try {
            const response = await authService.register(data);
            // Only set user if not a pending lecturer
            if (response.user.role !== 'pending_lecturer') {
                setUser(response.user);
            }
            return response;
        } finally {
            setIsLoading(false);
            suppressAuthChange.current = false;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const isAdmin = () => user?.role === 'admin';
    const isStaff = () => user?.role === 'staff' || user?.role === 'admin';
    const isSuperAdmin = () => !!user?.is_superadmin;

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                updateUser,
                isAdmin,
                isStaff,
                isSuperAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

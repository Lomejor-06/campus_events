import { supabase } from './supabaseClient';

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'student' | 'pending_lecturer' | 'staff' | 'admin';
    matric_number?: string;
    staff_id?: string;
    phone?: string;
    department_id?: number;
    preferred_language: string;
    is_active: boolean;
    is_superadmin: boolean;
    created_at?: string;
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
    role?: 'student' | 'pending_lecturer';
    phone?: string;
    matric_number?: string;
    staff_id?: string;
    department_id?: number;
    preferred_language: string;
}

export interface AuthResponse {
    user: User;
    message: string;
}

let isRegistering = false;

const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('User not found');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        const userData = profile as User;

        // Block pending lecturers from logging in
        if (userData.role === 'pending_lecturer') {
            await supabase.auth.signOut();
            throw new Error('Your lecturer account is pending admin approval. Please wait for an administrator to approve your account.');
        }

        // Block inactive users
        if (!userData.is_active) {
            await supabase.auth.signOut();
            throw new Error('Your account has been deactivated. Please contact an administrator.');
        }

        localStorage.setItem('user', JSON.stringify(userData));
        return { user: userData, message: 'Logged in successfully' };
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        console.log('[REGISTER] Starting registration for:', data.email);
        isRegistering = true;

        try {
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            console.log('[REGISTER] SignUp result:', { userId: authData?.user?.id, error: error?.message, identities: authData?.user?.identities?.length });

            if (error) {
                console.error('[REGISTER] SignUp error:', error);
                throw error;
            }
            if (!authData.user) throw new Error('Registration failed');

            // Supabase returns a fake success with empty identities for existing users
            if (authData.user.identities && authData.user.identities.length === 0) {
                console.warn('[REGISTER] User already exists (empty identities)');
                throw new Error('An account with this email already exists. Please log in instead.');
            }

            const isPendingLecturer = data.role === 'pending_lecturer';

            const newUser: Record<string, any> = {
                id: authData.user.id,
                email: data.email,
                full_name: data.full_name,
                role: data.role || 'student',
                phone: data.phone || null,
                preferred_language: data.preferred_language || 'en',
                is_active: !isPendingLecturer,
            };

            // Only include optional fields if they have values
            if (data.matric_number) newUser.matric_number = data.matric_number;
            if (data.staff_id) newUser.staff_id = data.staff_id;
            if (data.department_id) newUser.department_id = data.department_id;

            console.log('[REGISTER] Inserting profile:', newUser);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .insert([newUser])
                .select()
                .single();

            console.log('[REGISTER] Profile insert result:', { profile: !!profile, error: profileError });

            if (profileError) {
                console.error('[REGISTER] Profile insert error:', profileError);
                throw new Error(profileError.message || 'Failed to create user profile. Please check database migration.');
            }

            const userData = profile as User;

            if (isPendingLecturer) {
                // Sign out pending lecturers - they can't use the app until approved
                await supabase.auth.signOut();
                // Notify all admins about the new pending lecturer
                this.notifyAdminsOfPendingLecturer(data.full_name, data.email).catch(err => {
                    console.error('[REGISTER] Failed to notify admins:', err);
                });
                return { 
                    user: userData, 
                    message: 'Your lecturer account has been submitted for approval. You will be able to log in once an administrator approves your account.' 
                };
            }

            console.log('[REGISTER] Success! Storing user data');
            localStorage.setItem('user', JSON.stringify(userData));
            return { user: userData, message: 'Registered successfully' };
        } finally {
            isRegistering = false;
        }
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
    },

    async getProfile(uid: string): Promise<User> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (error) throw error;
        return data as User;
    },

    async updateProfile(uid: string, data: Partial<User>): Promise<User> {
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', uid)
            .select()
            .single();

        if (error) throw error;
        
        const userData = updatedProfile as User;
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    },

    async changePassword(newPassword: string): Promise<void> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    onAuthChange(callback: (user: User | null) => void) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Skip profile fetch if registration is in progress. The register function will handle setting the profile.
            if (isRegistering) {
                return;
            }
            // Use non-async callback to prevent blocking signUp/signIn resolution
            if (session?.user) {
                // Fire-and-forget async profile fetch
                Promise.resolve(
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                ).then(({ data: profile, error }) => {
                    if (error) {
                        console.error('Profile fetch error:', error);
                        callback(null);
                        return;
                    }
                    if (profile) {
                        const userData = profile as User;
                        if (userData.role === 'pending_lecturer') {
                            localStorage.removeItem('user');
                            callback(null);
                            return;
                        }
                        localStorage.setItem('user', JSON.stringify(userData));
                        callback(userData);
                    } else {
                        callback(null);
                    }
                }).catch((err: Error) => {
                    console.error('Profile fetch exception:', err);
                    callback(null);
                });
            } else {
                localStorage.removeItem('user');
                callback(null);
            }
        });

        return () => subscription.unsubscribe();
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('user');
    },

    // ── Admin Methods ──

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        
        if (error) throw error;
        return data as User[];
    },

    async getPendingLecturers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'pending_lecturer')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as User[];
    },

    async approveLecturer(uid: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'staff', is_active: true })
            .eq('id', uid);
        
        if (error) throw error;
    },

    async rejectLecturer(uid: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', uid);
        
        if (error) throw error;
    },

    async updateUserRole(uid: string, role: 'student' | 'staff' | 'admin'): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', uid);
        
        if (error) throw error;
    },

    async toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', uid);
        
        if (error) throw error;
    },

    async deleteUser(uid: string): Promise<void> {
        // First check if the user is a superadmin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_superadmin')
            .eq('id', uid)
            .single();

        if (profile?.is_superadmin) {
            throw new Error('Cannot delete the superadmin account.');
        }

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', uid);
        
        if (error) throw error;
    },

    async addAdmin(email: string, password: string, fullName: string): Promise<void> {
        // Store the current session so we can restore it after creating the new user
        const { data: currentSession } = await supabase.auth.getSession();

        // Create the auth user via Supabase signup
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create admin account');

        // Create the profile with admin role
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                email,
                full_name: fullName,
                role: 'admin',
                is_active: true,
                is_superadmin: false,
                preferred_language: 'en',
            }]);

        if (profileError) throw profileError;

        // Restore the original admin session if it was disrupted
        if (currentSession?.session) {
            await supabase.auth.setSession({
                access_token: currentSession.session.access_token,
                refresh_token: currentSession.session.refresh_token,
            });
        }
    },

    async setSuperadmin(uid: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ is_superadmin: true, role: 'admin' })
            .eq('id', uid);
        
        if (error) throw error;
    },

    async notifyAdminsOfPendingLecturer(lecturerName: string, lecturerEmail: string): Promise<void> {
        try {
            // Fetch all admin users
            const { data: admins, error: adminError } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');

            if (adminError || !admins || admins.length === 0) {
                console.warn('[NOTIFY] No admins found to notify');
                return;
            }

            // Create a notification for each admin
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                title: 'New Lecturer Pending Approval',
                message: `${lecturerName} (${lecturerEmail}) has registered as a lecturer and is awaiting your approval.`,
                event_id: null,
                read: false,
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) {
                console.error('[NOTIFY] Failed to insert admin notifications:', insertError);
            }
        } catch (err) {
            console.error('[NOTIFY] Error notifying admins:', err);
        }
    },
};

export default authService;

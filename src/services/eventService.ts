import { supabase } from './supabaseClient';

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    venue: string;
    max_attendees: number;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    image_url?: string;
    category_id?: string;
    category?: Category;
    department_id?: number;
    created_by: string;
    creator_name?: string;
    registration_count: number;
    is_full: boolean;
    spots_left: number | null;
    is_upcoming: boolean;
    is_registered?: boolean;
    is_saved?: boolean;
}

export interface EventFormData {
    title: string;
    description: string;
    category_id: string;
    venue: string;
    start_date: string;
    end_date: string;
    max_attendees: number;
    status: string;
    department_id?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
}

export interface EventFilters {
    page?: number;
    per_page?: number;
    category?: string;
    q?: string;
    status?: string;
    department_id?: number;
}

const eventService = {
    async getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
        const per_page = filters.per_page || 10;
        const page = filters.page || 1;
        const start = (page - 1) * per_page;
        const end = start + per_page - 1;

        let query = supabase
            .from('events')
            .select('*, category:categories(*), creator:profiles!created_by(full_name, department_id)', { count: 'exact' });

        if (filters.category) {
            query = query.eq('category_id', filters.category);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.q) {
            query = query.ilike('title', `%${filters.q}%`);
        }
        if (filters.department_id) {
            query = query.eq('department_id', filters.department_id);
        }

        const { data, error, count } = await query
            .order('start_date', { ascending: false })
            .range(start, end);

        if (error) throw error;

        const items = data.map(item => this.mapEvent(item));
        const total = count || 0;
        const pages = Math.ceil(total / per_page);

        return {
            items,
            total,
            page,
            pages,
            per_page
        };
    },

    async getEvent(id: string, userId?: string): Promise<Event> {
        const { data, error } = await supabase
            .from('events')
            .select('*, category:categories(*), creator:profiles!created_by(full_name, department_id)')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        const event = this.mapEvent(data);
        
        if (userId) {
            event.is_registered = await this.checkRegistration(id, userId);
            event.is_saved = await this.checkSaved(id, userId);
        }
        
        return event;
    },

    async createEvent(data: EventFormData, userId: string): Promise<Event> {
        // Get the creator's department_id from their profile
        let creatorDeptId = data.department_id;
        if (!creatorDeptId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('department_id')
                .eq('id', userId)
                .single();
            creatorDeptId = profile?.department_id || undefined;
        }

        const { data: newEvent, error } = await supabase
            .from('events')
            .insert([{
                ...data,
                created_by: userId,
                department_id: creatorDeptId || null,
                registration_count: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return this.mapEvent(newEvent);
    },

    async updateEvent(id: string, data: Partial<EventFormData>): Promise<void> {
        const { error } = await supabase
            .from('events')
            .update(data)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteEvent(id: string): Promise<void> {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error("Failed to delete event. You do not have permission or it's already deleted.");
            }
            throw error;
        }
    },

    async registerForEvent(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('registrations')
            .insert([{ event_id: id, user_id: userId }]);

        if (error) throw error;
        
        // Update registration count
        await supabase.rpc('increment_registration', { row_id: id });
    },

    async unregisterFromEvent(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('registrations')
            .delete()
            .match({ event_id: id, user_id: userId });

        if (error) throw error;

        // Update registration count
        await supabase.rpc('decrement_registration', { row_id: id });
    },

    async saveEvent(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('saved_events')
            .insert([{ event_id: id, user_id: userId }]);

        if (error) throw error;
    },

    async unsaveEvent(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('saved_events')
            .delete()
            .match({ event_id: id, user_id: userId });

        if (error) throw error;
    },

    async getSavedEvents(userId: string): Promise<Event[]> {
        const { data, error } = await supabase
            .from('saved_events')
            .select('event:events(*, category:categories(*), creator:profiles!created_by(full_name, department_id))')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(item => this.mapEvent(item.event));
    },

    async getMyEvents(userId: string): Promise<Event[]> {
        const { data, error } = await supabase
            .from('events')
            .select('*, category:categories(*), creator:profiles!created_by(full_name, department_id)')
            .eq('created_by', userId);

        if (error) throw error;
        return data.map(item => this.mapEvent(item));
    },

    async getCalendarEvents(departmentId?: number): Promise<Event[]> {
        let query = supabase
            .from('events')
            .select('*, category:categories(*), creator:profiles!created_by(full_name, department_id)');

        if (departmentId) {
            query = query.eq('department_id', departmentId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data.map(item => this.mapEvent(item));
    },

    async getCategories(): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*');

        if (error) throw error;
        return data as Category[];
    },

    async getUserRegistrations(userId: string): Promise<Event[]> {
        const { data, error } = await supabase
            .from('registrations')
            .select('event:events(*, category:categories(*), creator:profiles!created_by(full_name, department_id))')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(item => this.mapEvent(item.event));
    },

    async checkRegistration(eventId: string, userId: string): Promise<boolean> {
        const { data } = await supabase
            .from('registrations')
            .select('id')
            .match({ event_id: eventId, user_id: userId })
            .maybeSingle();

        return !!data;
    },

    async checkSaved(eventId: string, userId: string): Promise<boolean> {
        const { data } = await supabase
            .from('saved_events')
            .select('id')
            .match({ event_id: eventId, user_id: userId })
            .maybeSingle();

        return !!data;
    },

    mapEvent(data: any): Event {
        const registration_count = data.registration_count || 0;
        const max_attendees = data.max_attendees || 0;
        const is_full = max_attendees > 0 && registration_count >= max_attendees;
        const now = new Date();
        const start = new Date(data.start_date);

        // Extract creator name from joined profile data
        const creator_name = data.creator?.full_name || null;

        return {
            ...data,
            registration_count,
            is_full,
            spots_left: max_attendees > 0 ? max_attendees - registration_count : null,
            is_upcoming: start > now,
            creator_name,
        };
    }
};

export default eventService;

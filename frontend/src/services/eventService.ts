import api from './api';

export interface Category {
    id: number;
    name: string;
    name_ha?: string;
    name_yo?: string;
    name_ig?: string;
    color: string;
    icon: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    venue: string;
    max_attendees: number;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    image_url?: string;
    category_id?: number;
    category?: Category;
    created_by: number;
    creator?: {
        id: number;
        full_name: string;
    };
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
    category_id: number;
    venue: string;
    start_date: string;
    end_date: string;
    max_attendees: number;
    status: string;
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
    category?: number;
    q?: string;
    status?: string;
}

const eventService = {
    async getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
        const params = new URLSearchParams();
        if (filters.page) params.append('page', String(filters.page));
        if (filters.per_page) params.append('per_page', String(filters.per_page));
        if (filters.category) params.append('category', String(filters.category));
        if (filters.q) params.append('q', filters.q);
        if (filters.status) params.append('status', filters.status);

        const response = await api.get<PaginatedResponse<Event>>(`/events?${params}`);
        return response.data;
    },

    async getEvent(id: number): Promise<Event> {
        const response = await api.get<Event>(`/events/${id}`);
        return response.data;
    },

    async createEvent(data: EventFormData): Promise<Event> {
        const response = await api.post<Event>('/events', data);
        return response.data;
    },

    async updateEvent(id: number, data: EventFormData): Promise<Event> {
        const response = await api.put<Event>(`/events/${id}`, data);
        return response.data;
    },

    async deleteEvent(id: number): Promise<void> {
        await api.delete(`/events/${id}`);
    },

    async registerForEvent(id: number): Promise<void> {
        await api.post(`/events/${id}/register`);
    },

    async unregisterFromEvent(id: number): Promise<void> {
        await api.post(`/events/${id}/unregister`);
    },

    async saveEvent(id: number): Promise<void> {
        await api.post(`/events/${id}/save`);
    },

    async unsaveEvent(id: number): Promise<void> {
        await api.post(`/events/${id}/unsave`);
    },

    async getSavedEvents(): Promise<Event[]> {
        const response = await api.get<Event[]>('/events/saved');
        return response.data;
    },

    async getMyEvents(page: number = 1): Promise<PaginatedResponse<Event>> {
        const response = await api.get<PaginatedResponse<Event>>(`/events/my-events?page=${page}`);
        return response.data;
    },

    async getCalendarEvents(start?: string, end?: string): Promise<Event[]> {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);

        const response = await api.get<Event[]>(`/events/calendar?${params}`);
        return response.data;
    },

    async getCategories(): Promise<Category[]> {
        const response = await api.get<Category[]>('/categories');
        return response.data;
    },
};

export default eventService;

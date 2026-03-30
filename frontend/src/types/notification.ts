export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    event_id?: number;
    triggered_by?: string;
}

export interface PaginatedNotifications {
    items: Notification[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: any; // Firebase Timestamp or string
    event_id?: string;
    triggered_by?: string;
}

export interface PaginatedNotifications {
    items: Notification[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
}

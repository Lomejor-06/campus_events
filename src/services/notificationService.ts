import { supabase } from './supabaseClient';

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    event_id: string;
    read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(userId: string): Promise<AppNotification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }

        return data as AppNotification[];
    },

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }

        return count || 0;
    },

    async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
};

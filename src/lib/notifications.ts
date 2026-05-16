
import { supabase } from './supabase';
import { AppNotification, NotificationPreference } from './types';

export const NotificationService = {
  // --- Push Notifications ---
  
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async savePushToken(userId: string, token: string, deviceInfo: any = {}) {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        device_info: deviceInfo,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id, token' });
    
    if (error) throw error;
  },

  // --- Notification Center ---

  async fetchNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  // --- Preferences ---

  async fetchPreferences(userId: string): Promise<NotificationPreference | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updatePreferences(userId: string, prefs: Partial<NotificationPreference>) {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  },

  // --- Local Notification Helper ---
  
  showLocalNotification(title: string, body: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png', // Fallback if no icon
        ...options
      });
    }
  }
};

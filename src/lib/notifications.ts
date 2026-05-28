
import { supabase } from './supabase';
import { AppNotification, NotificationPreference } from './types';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationService = {
  // --- Push Notifications ---
  
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support push notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribeUserToPush(userId: string) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    // Attempt dynamic backend handshake to pull the active persistent VAPID public key
    try {
      const res = await fetch('/api/notifications/vapid-public-key');
      if (res.ok) {
        const data = await res.json();
        if (data && data.publicKey) {
          vapidPublicKey = data.publicKey;
        }
      }
    } catch (e) {
      console.warn('Unable to handshake with backend VAPID endpoint, falling back to client environment config:', e);
    }
    
    if (!vapidPublicKey) {
      console.warn('VAPID public key not found in server or client environment');
      return null;
    }

    // Convert the key for solid cross-browser/mobile compatibility
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    // Save to Supabase
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: JSON.stringify(subscription),
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        },
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id, token' });

    if (error) throw error;
    return subscription;
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

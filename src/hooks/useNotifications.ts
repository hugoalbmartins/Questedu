import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SFX } from "@/lib/sounds";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = (studentId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!studentId) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      const items = data as any as Notification[];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    loadNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const newNotif = payload.new as any as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          SFX.upgrade();
          toast(`${newNotif.icon} ${newNotif.title}`, {
            description: newNotif.message,
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, loadNotifications]);

  const markAsRead = useCallback(async (notifId: string) => {
    await supabase
      .from("notifications" as any)
      .update({ read: true } as any)
      .eq("id", notifId);
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!studentId) return;
    await supabase
      .from("notifications" as any)
      .update({ read: true } as any)
      .eq("student_id", studentId)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [studentId]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, reload: loadNotifications };
};

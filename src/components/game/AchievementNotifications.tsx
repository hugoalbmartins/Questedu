import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { X, Sparkles } from "lucide-react";

interface AchievementNotification {
  id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  achievement_rarity: string;
  reward_coins: number;
  reward_diamonds: number;
  reward_xp: number;
  created_at: string;
}

interface AchievementNotificationsProps {
  studentId: string;
}

export function AchievementNotifications({ studentId }: AchievementNotificationsProps) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<AchievementNotification[]>([]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [studentId]);

  useEffect(() => {
    if (notifications.length > displayedNotifications.length) {
      const newNotifications = notifications.slice(displayedNotifications.length);
      newNotifications.forEach((notif, index) => {
        setTimeout(() => {
          setDisplayedNotifications(prev => [...prev, notif]);
          triggerConfetti(notif.achievement_rarity);
        }, index * 500);
      });
    }
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_achievement_notifications', {
          student_id_param: studentId
        });

      if (error) throw error;
      if (data && data.length > 0) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading achievement notifications:', error);
    }
  };

  const triggerConfetti = (rarity: string) => {
    const particleCount = {
      common: 50,
      uncommon: 75,
      rare: 100,
      epic: 150,
      legendary: 200
    }[rarity] || 50;

    const colors = {
      common: ['#94a3b8'],
      uncommon: ['#22c55e'],
      rare: ['#3b82f6', '#06b6d4'],
      epic: ['#a855f7', '#ec4899'],
      legendary: ['#f59e0b', '#eab308', '#fbbf24']
    }[rarity] || ['#94a3b8'];

    confetti({
      particleCount,
      spread: 100,
      origin: { y: 0.4 },
      colors,
      ticks: 200,
    });
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await supabase.rpc('mark_notifications_read', {
        notification_ids: [notificationId]
      });

      setDisplayedNotifications(prev => prev.filter(n => n.id !== notificationId));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      uncommon: 'from-green-500/20 to-green-600/20 border-green-500/30',
      rare: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      epic: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      legendary: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadgeColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-500/20 text-gray-600 border-gray-600/30',
      uncommon: 'bg-green-500/20 text-green-600 border-green-600/30',
      rare: 'bg-blue-500/20 text-blue-600 border-blue-600/30',
      epic: 'bg-purple-500/20 text-purple-600 border-purple-600/30',
      legendary: 'bg-yellow-500/20 text-yellow-600 border-yellow-600/30'
    };
    return colors[rarity] || colors.common;
  };

  if (displayedNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {displayedNotifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 shadow-xl border-2 bg-gradient-to-br ${getRarityColor(notification.achievement_rarity)} animate-in slide-in-from-right duration-500`}
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl animate-bounce">
              {notification.achievement_icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h4 className="font-bold text-lg">Conquista Desbloqueada!</h4>
              </div>
              <p className="font-semibold text-base mb-1">
                {notification.achievement_name}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.achievement_description}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getRarityBadgeColor(notification.achievement_rarity)}>
                  {notification.achievement_rarity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {notification.reward_coins > 0 && (
                  <span className="font-semibold text-yellow-600">
                    +{notification.reward_coins} 🪙
                  </span>
                )}
                {notification.reward_diamonds > 0 && (
                  <span className="font-semibold text-blue-600">
                    +{notification.reward_diamonds} 💎
                  </span>
                )}
                {notification.reward_xp > 0 && (
                  <span className="font-semibold text-purple-600">
                    +{notification.reward_xp} ⭐
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissNotification(notification.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

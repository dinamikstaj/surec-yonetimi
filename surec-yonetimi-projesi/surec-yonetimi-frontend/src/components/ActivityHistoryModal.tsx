"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Activity, Clock, User, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils";

interface ActivityItem {
  _id: string;
  message: string;
  createdAt: string;
  username?: string;
  type?: string;
  details?: string;
}

interface ActivityHistoryModalProps {
  userId: string;
  onClose: () => void;
}

const ActivityHistoryModal: React.FC<ActivityHistoryModalProps> = ({
  userId,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${getApiBaseUrl()}/users/${userId}/activities`);
      
      if (!response.ok) {
        throw new Error('Etkinlik geçmişi alınamadı');
      }

      const data = await response.json();
      setActivities(data);
    } catch (error: any) {
      console.error('Etkinlik geçmişi hatası:', error);
      toast.error(error.message || 'Etkinlik geçmişi yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (message: string) => {
    if (message.includes('giriş')) return <User className="h-4 w-4 text-green-600" />;
    if (message.includes('güncellendi')) return <Activity className="h-4 w-4 text-blue-600" />;
    if (message.includes('şifre')) return <Calendar className="h-4 w-4 text-orange-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getActivityType = (message: string) => {
    if (message.includes('giriş')) return { type: 'Giriş', variant: 'default' as const };
    if (message.includes('güncellendi')) return { type: 'Güncelleme', variant: 'secondary' as const };
    if (message.includes('şifre')) return { type: 'Güvenlik', variant: 'destructive' as const };
    return { type: 'Diğer', variant: 'outline' as const };
  };

  const handleRefresh = () => {
    fetchActivities(true);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]" aria-describedby="activity-dialog-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Etkinlik Geçmişi
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>
        </DialogHeader>
        <div id="activity-dialog-description" className="sr-only">
          Hesabınızla ilgili tüm etkinliklerin geçmişini görüntüleyebilirsiniz.
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Son Etkinlikler
              </span>
              <Badge variant="outline">{activities.length} etkinlik</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Etkinlikler yükleniyor...</p>
                </div>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Henüz etkinlik yok</h3>
                    <p className="text-sm text-muted-foreground">
                      Hesabınızla ilgili etkinlikler burada görünecek
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] px-6">
                <div className="space-y-4 pb-4">
                  {activities.map((activity, index) => {
                    const activityType = getActivityType(activity.message);
                    return (
                      <div key={activity._id} className="relative">
                        {/* Timeline line */}
                        {index !== activities.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                        )}
                        
                        <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 relative">
                            <div className="p-2 bg-background border border-border rounded-full">
                              {getActivityIcon(activity.message)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant={activityType.variant} className="text-xs">
                                {activityType.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm leading-relaxed">
                              {activity.message}
                            </p>
                            
                            {activity.username && (
                              <p className="text-xs text-muted-foreground">
                                Kullanıcı: {activity.username}
                              </p>
                            )}
                            
                            {activity.details && (
                              <p className="text-xs bg-muted/50 p-2 rounded">
                                {activity.details}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {index !== activities.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityHistoryModal; 
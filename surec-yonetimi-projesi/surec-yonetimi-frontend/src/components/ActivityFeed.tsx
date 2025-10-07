// components/ActivityFeed.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';

interface Activity {
  message: string;
  createdAt: string;
}

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2 hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle>Son Etkinlikler</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]"> {/* YÜKSEKLİK BURADA GÜNCELLENDİ */}
        <ScrollArea className="h-full pr-4">
          <ul className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <li key={index} className="flex items-start space-x-4 p-3 bg-muted rounded-md shadow-sm">
                  <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">Henüz bir etkinlik yok.</p>
            )}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
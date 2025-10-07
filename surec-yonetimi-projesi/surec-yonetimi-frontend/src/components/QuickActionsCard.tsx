// components/QuickActionsCard.tsx
// Bu dosyayı oluşturun ve kodu içine yapıştırın

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';

export default function QuickActionsCard() {
  const [formData, setFormData] = useState({ to: '', subject: '', body: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSendEmail = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Mail başarıyla gönderildi!');
        setFormData({ to: '', subject: '', body: '' });
        setIsDialogOpen(false);
      } else {
        const errorData = await res.json();
        toast.error(`Mail gönderme başarısız: ${errorData.msg}`);
      }
    } catch (error) {
      toast.error('Sunucuya bağlanılamadı.');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle>Hızlı İşlemler</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Mail className="mr-2 h-4 w-4" /> Mail Gönder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Mail Gönder</DialogTitle>
              <DialogDescription>
                Müşterilere veya ekibe hızlıca mail göndermek için formu doldurun.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to" className="text-right">
                  Kime
                </Label>
                <Input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Konu
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="body" className="text-right">
                  İçerik
                </Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  İptal
                </Button>
              </DialogClose>
              <Button type="submit" onClick={handleSendEmail}>
                <Send className="mr-2 h-4 w-4" /> Gönder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
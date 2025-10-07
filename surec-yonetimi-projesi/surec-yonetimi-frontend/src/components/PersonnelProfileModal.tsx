'use client';

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removed role select imports to prevent role changes by personnel
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, User, Save, X } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, getApiBaseUrl } from "@/lib/utils";

interface PersonnelProfileModalProps {
  token: string;
  currentName: string;
  currentPhone: string;
  currentImage?: string;
  currentEmail: string;
  currentRole: string;
  onClose: () => void;
}

const PersonnelProfileModal: React.FC<PersonnelProfileModalProps> = ({
  token,
  currentName,
  currentPhone,
  currentImage,
  currentEmail,
  currentRole,
  onClose,
}) => {
  const [name, setName] = useState<string>(currentName);
  const [phone, setPhone] = useState<string>(currentPhone);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(currentEmail);
  const [role] = useState<string>(currentRole);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Preview için URL oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      // Do NOT allow role updates from personnel profile modal
      if (imageFile) formData.append('avatar', imageFile);

      // Token'ı userId olarak kullan
      const userId = token;
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `HTTP ${response.status}: Profil güncellenemedi.`);
      }

      const result = await response.json();
      toast.success('Profil başarıyla güncellendi!');
      onClose();
      
      // Sayfayı yeniden yükle ki güncel bilgiler görünsün
      window.location.reload();
    } catch (err: any) {
      console.error('Profil güncelleme hatası:', err);
      toast.error(err.message || 'Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarFallback = (name: string, email: string) => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getDisplayImage = () => {
    if (imagePreview) return imagePreview;
    if (currentImage) return `${getApiUrl()}${currentImage}`;
    return undefined;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profili Düzenle
          </DialogTitle>
        </DialogHeader>
        <div id="dialog-description" className="sr-only">
          Profil bilgilerinizi ve fotoğrafınızı güncelleyebilirsiniz.
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <Card className="p-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20">
                {getDisplayImage() && (
                  <AvatarImage 
                    src={getDisplayImage()}
                    alt={name || email}
                  />
                )}
                <AvatarFallback className="text-2xl font-semibold">
                  {getAvatarFallback(name, email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-muted-foreground rounded-lg hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {imageFile ? "Fotoğraf Seçildi" : "Fotoğraf Seç"}
                    </span>
                  </div>
                </Label>
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG veya GIF formatında, maksimum 5MB
                </p>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Adınızı ve soyadınızı girin"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="E-posta adresinizi girin"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Telefon numaranızı girin"
              required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                value={role === 'yonetici' ? 'Yönetici' : 'Personel'}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">Rol değişikliği yalnızca yöneticiler tarafından yapılabilir.</p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="gap-2">
              <X className="h-4 w-4" />
              İptal
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PersonnelProfileModal;

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, X, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils";

interface PasswordChangeModalProps {
  userId: string;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  userId,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Yeni şifre mevcut şifreden farklı olmalıdır");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Şifre değiştirilemedi');
      }

      toast.success('Şifre başarıyla değiştirildi!');
      onClose();
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      toast.error(error.message || 'Şifre değiştirirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6) return { strength: 25, text: "Çok Zayıf", color: "bg-red-500" };
    if (password.length < 8) return { strength: 50, text: "Zayıf", color: "bg-orange-500" };
    if (password.length < 12) return { strength: 75, text: "Orta", color: "bg-yellow-500" };
    return { strength: 100, text: "Güçlü", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]" aria-describedby="password-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Şifre Değiştir
          </DialogTitle>
        </DialogHeader>
        <div id="password-dialog-description" className="sr-only">
          Mevcut şifrenizi girerek yeni şifre belirleyebilirsiniz.
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Güvenlik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mevcut Şifre */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre *</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Yeni Şifre */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifrenizi girin"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Şifre Gücü Göstergesi */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Şifre Gücü:</span>
                      <span className={passwordStrength.strength >= 75 ? "text-green-600" : passwordStrength.strength >= 50 ? "text-yellow-600" : "text-red-600"}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Şifre Tekrarı */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrarı *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrenizi tekrar girin"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600">Şifreler eşleşmiyor</p>
                )}
              </div>

              <Separator />

              {/* Şifre Kuralları */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Şifre Kuralları:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• En az 6 karakter uzunluğunda olmalıdır</li>
                  <li>• Büyük ve küçük harf içermesi önerilir</li>
                  <li>• Sayı ve özel karakter içermesi önerilir</li>
                  <li>• Mevcut şifreden farklı olmalıdır</li>
                </ul>
              </div>

              {/* Butonlar */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="gap-2">
                  <X className="h-4 w-4" />
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal; 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function PersonnelLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Giriş işlemi başarısız oldu.');
      }

      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.userId);

      toast.success('Giriş başarılı!');

      setTimeout(() => {
        if (data.role === 'yonetici') {
          router.push('/admin/dashboard');
        } else if (data.role === 'kullanici') {
          router.push('/personnel/dashboard');
        }
      }, 500);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2a2d3a]">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-40 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <ModeToggle />
      </div>

      {/* Main Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl bg-[#35374a] border border-gray-700/30 animate-scale-in">
          
          {/* Left Side - Image Section */}
          <div className="hidden md:flex md:w-1/2 relative overflow-hidden group">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074)',
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70 transition-opacity duration-500 group-hover:opacity-90"></div>
            </div>
            
            {/* Content on Image */}
            <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
              {/* Logo */}
              <div className="mb-12 transform transition-all duration-500 hover:scale-105 animate-fade-in">
                <Image
                  src="https://www.dinamikotomasyon.com/wp-content/uploads/2024/01/Logo-Beyaz-300x132.png"
                  alt="Dinamik Otomasyon"
                  width={200}
                  height={88}
                  priority
                  className="object-contain drop-shadow-2xl"
                />
              </div>

              {/* Slogan */}
              <h2 className="text-4xl font-light mb-4 tracking-wide animate-slide-in-left">
                Personel Yönetimi,
                <br />
                Kolayca
              </h2>
              
              {/* Dots Indicator */}
              <div className="flex gap-2 mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="w-8 h-1 bg-white rounded-full transition-all duration-300 hover:w-12"></div>
                <div className="w-8 h-1 bg-white/40 rounded-full transition-all duration-300 hover:bg-white/60 hover:w-10"></div>
                <div className="w-8 h-1 bg-white/40 rounded-full transition-all duration-300 hover:bg-white/60 hover:w-10"></div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="w-full md:w-1/2 bg-[#2a2d3a] p-12 flex items-center justify-center">
            <div className="w-full max-w-md space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              
              {/* Title */}
              <div className="text-center transform transition-all duration-500">
                <h1 className="text-3xl font-light text-white mb-2 tracking-wide">
                  Personel Girişi
                </h1>
                <p className="text-gray-400 text-sm font-light">
                  Görevlerinize erişim sağlayın
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${emailFocused ? 'text-blue-400 scale-110' : 'text-gray-500'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="h-14 px-12 bg-[#35374a] border-gray-600/50 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:bg-[#3a3d4f]"
                    required
                  />
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ${emailFocused ? 'w-full' : 'w-0'}`}></div>
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${passwordFocused ? 'text-blue-400 scale-110' : 'text-gray-500'}`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="h-14 px-12 pr-12 bg-[#35374a] border-gray-600/50 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:bg-[#3a3d4f]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ${passwordFocused ? 'w-full' : 'w-0'}`}></div>
                </div>

                {/* Login Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-base shadow-lg hover:shadow-blue-500/40 transition-all duration-300 border-0 relative overflow-hidden group transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  <span className="relative z-10">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Giriş yapılıyor...</span>
                      </div>
                    ) : (
                      'Giriş Yap'
                    )}
                  </span>
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"></div>
                </Button>

                {/* Back to Admin Login Button */}
                <Button
                  type="button"
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-transparent border-gray-600/50 text-gray-300 hover:bg-[#35374a] hover:border-blue-500/50 hover:text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Yönetici Girişi
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.7s ease-out;
        }
      `}</style>
    </div>
  );
}

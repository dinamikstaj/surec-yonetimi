// Auth utility fonksiyonları

export const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem("userId");
  
  // Eğer userId yoksa token'dan decode et
  if (!userId) {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        // JWT token'ı decode et (basit base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload._id || payload.user?.id;
        
        if (userId) {
          localStorage.setItem('userId', userId);
          console.log('UserId token\'dan decode edildi:', userId);
        }
      } catch (error) {
        console.error('Token decode hatası:', error);
      }
    }
  }
  
  return userId;
};

export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("userRole");
};

export const getUserToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("userToken");
};

export const isAuthenticated = (): boolean => {
  return !!(getUserToken() && getUserId());
};

export const isAdmin = (): boolean => {
  return getUserRole() === 'yonetici';
};

export const isPersonnel = (): boolean => {
  return getUserRole() === 'kullanici';
};

export const requireRole = (requiredRole: 'yonetici' | 'kullanici', redirectTo: string = '/login'): boolean => {
  const userRole = getUserRole();
  console.log('Role kontrolü:', { required: requiredRole, current: userRole });
  
  if (userRole !== requiredRole) {
    console.log('Role uyumsuzluğu, yönlendiriliyor:', redirectTo);
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1000);
    return false;
  }
  return true;
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('userToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  
  window.location.href = '/login';
};

export const requireAuth = (redirectTo: string = '/login') => {
  if (!isAuthenticated()) {
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1000);
    return false;
  }
  return true;
}; 
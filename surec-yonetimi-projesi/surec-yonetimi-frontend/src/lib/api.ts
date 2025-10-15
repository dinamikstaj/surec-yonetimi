// API URL'lerini dinamik olarak belirle
export const getApiUrl = () => {
  // Eğer environment variable varsa onu kullan
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Browser'da çalışıyorsa
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Eğer port varsa (development)
    if (port) {
      return `${protocol}//${hostname}:5000/api`;
    }
    
    // Production'da port yoksa
    return `${protocol}//${hostname}/api`;
  }
  
  // Server-side rendering sırasında
  return 'http://localhost:5000/api';
};

export const getSocketUrl = () => {
  // Eğer environment variable varsa onu kullan
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // Browser'da çalışıyorsa
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Eğer port varsa (development)
    if (port) {
      return `${protocol}//${hostname}:5000`;
    }
    
    // Production'da port yoksa
    return `${protocol}//${hostname}`;
  }
  
  // Server-side rendering sırasında
  return 'http://localhost:5000';
};

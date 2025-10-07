import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dinamik API URL'i almak için helper fonksiyon
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000'; // Server-side fallback
}

export function getApiBaseUrl(): string {
  return `${getApiUrl()}/api`;
}

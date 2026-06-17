export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number; // milliseconds, default 3000
  position?: 'top' | 'bottom'; // default 'bottom'
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Global toast state
let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

/**
 * Subscribe to toast changes
 */
export function onToastChange(callback: (toasts: Toast[]) => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Notify all listeners of toast changes
 */
function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
) {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const duration = options.duration ?? 3000;

  const toast: Toast = {
    id,
    message,
    type,
    duration
  };

  toasts.push(toast);
  notifyListeners();

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

/**
 * Remove a specific toast
 */
export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

/**
 * Clear all toasts
 */
export function clearToasts() {
  toasts = [];
  notifyListeners();
}

/**
 * Convenience methods
 */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    showToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) =>
    showToast(message, 'error', options),
  info: (message: string, options?: ToastOptions) =>
    showToast(message, 'info', options),
  warning: (message: string, options?: ToastOptions) =>
    showToast(message, 'warning', options),
};

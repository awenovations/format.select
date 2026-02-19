import type { ConversionNotificationPayload } from './types';

type ToastHandler = (payload: ConversionNotificationPayload) => void;

let toastHandler: ToastHandler | null = null;

export function registerToastHandler(fn: ToastHandler): void {
	toastHandler = fn;
}

export function requestNotificationPermission(): void {
	if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
		Notification.requestPermission();
	}
}

export function notify(payload: ConversionNotificationPayload): void {
	if (document.visibilityState === 'visible') {
		toastHandler?.(payload);
	} else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
		new Notification(payload.message, {
			body: payload.filename,
			icon: '/favicon.svg'
		});
	}
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for 100% offline access without internet/wifi/mobile data
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('NXTGEN Roxas Attendance System is fully cached and ready to run offline.');
  },
});

// Safely suppress benign setPhotoOptions failed DOMException in Chromium / Android
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('setPhotoOptions') ||
      msg.includes('photo options') ||
      reason?.name === 'NotSupportedError'
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);


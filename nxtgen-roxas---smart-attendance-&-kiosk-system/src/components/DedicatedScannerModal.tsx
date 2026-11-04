import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  X,
  LogIn,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Scan,
} from 'lucide-react';
import {
  BarcodeFormat,
  DecodeHintType,
  MultiFormatReader,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { useAttendance, CheckInResult } from '../context/AttendanceContext';
import { getLevelDetails } from '../types/attendance';
import { sound } from '../utils/audio';

interface NativeBarcodeDetector {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
}

interface DedicatedScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'checkin' | 'checkout';
}

export const DedicatedScannerModal: React.FC<DedicatedScannerModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'checkin',
}) => {
  const { checkInKid, checkOutKid, selectedSunday, activeService } = useAttendance();

  const [kioskMode, setKioskMode] = useState<'checkin' | 'checkout'>(defaultMode);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true); // small screen vs fullscreen
  const [inputCode, setInputCode] = useState<string>('');
  const [useCamera, setUseCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  // Sync mode if default changes
  useEffect(() => {
    setKioskMode(defaultMode);
  }, [defaultMode]);

  // Focus input on mount or mode switch
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, kioskMode]);

  // Enumerate cameras
  useEffect(() => {
    if (!isOpen || typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCameraId) {
          const rearCam = videoInputs.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(rearCam ? rearCam.deviceId : videoInputs[0].deviceId);
        }
      })
      .catch(() => {});
  }, [isOpen, selectedCameraId]);

  // Continuous Camera QR & Barcode Scanner
  useEffect(() => {
    if (!isOpen || !useCamera) return;

    let stream: MediaStream | null = null;
    let scanTimer: NodeJS.Timeout | null = null;
    let isActive = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: selectedCameraId
            ? { deviceId: { exact: selectedCameraId } }
            : { facingMode: { ideal: 'environment' } },
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Native BarcodeDetector support
        let nativeDetector: NativeBarcodeDetector | null = null;
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const BD = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => NativeBarcodeDetector }).BarcodeDetector;
            nativeDetector = new BD({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a'],
            });
          } catch {
            nativeDetector = null;
          }
        }

        // ZXing Fallback
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const zxingReader = new MultiFormatReader();
        zxingReader.setHints(hints);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let isProcessing = false;

        const scanFrame = async () => {
          if (!isActive || isProcessing || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

          isProcessing = true;
          try {
            if (nativeDetector) {
              const barcodes = await nativeDetector.detect(video);
              if (isActive && barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (code) handleScannedCode(code);
              }
            } else if (ctx) {
              const w = Math.min(video.videoWidth, 640);
              const h = Math.min(video.videoHeight, 480);
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              const imgData = ctx.getImageData(0, 0, w, h);
              const luminanceSource = new RGBLuminanceSource(imgData.data, w, h);
              const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
              try {
                const result = zxingReader.decode(binaryBitmap);
                if (isActive && result) {
                  handleScannedCode(result.getText());
                }
              } catch {
                // frame has no code
              } finally {
                zxingReader.reset();
              }
            }
          } catch {
            // suppress per-frame errors
          } finally {
            isProcessing = false;
          }
        };

        scanTimer = setInterval(scanFrame, 160);
      } catch (err: unknown) {
        if (!isActive) return;
        setCameraError('Camera access required. Please allow camera permissions.');
      }
    };

    startCamera();

    return () => {
      isActive = false;
      if (scanTimer) clearInterval(scanTimer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, useCamera, selectedCameraId]);

  const handleScannedCode = (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    // Prevent immediate re-trigger on same code within 2 seconds
    const now = Date.now();
    if (cleanCode === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 2000) {
      return;
    }
    lastScannedCodeRef.current = cleanCode;
    lastScanTimestampRef.current = now;

    processEntry(cleanCode);
  };

  const processEntry = (query: string) => {
    if (kioskMode === 'checkin') {
      const res = checkInKid(query, activeService);
      setLastResult(res);
      if (res.success) {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    } else {
      const res = checkOutKid(query, query);
      setLastResult(res);
      if (res.success) {
        sound.playPickUp();
      } else {
        sound.playError();
      }
    }
    setInputCode('');
    inputRef.current?.focus();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    processEntry(inputCode.trim());
  };

  const toggleCameraLens = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].deviceId);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-6'
      }`}
    >
      <div
        className={`w-full bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'h-full max-h-screen rounded-none border-0'
            : 'max-w-xl max-h-[92vh] rounded-3xl border-2 border-cyan-500/30'
        }`}
      >
        {/* Top Control Bar: Mode Toggle + Screen Size (Small Screen / Fullscreen) + Close */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
          {/* Check-In vs Parent Pick-up Toggle */}
          <div
            className={`p-1 rounded-2xl border flex items-center gap-1.5 transition-all ${
              kioskMode === 'checkout'
                ? 'bg-orange-500/20 border-[#FF6F00]'
                : 'bg-slate-950 border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setKioskMode('checkin');
                setLastResult(null);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                kioskMode === 'checkin'
                  ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Check-In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setKioskMode('checkout');
                setLastResult(null);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                kioskMode === 'checkout'
                  ? 'bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white shadow-md shadow-orange-500/50 ring-2 ring-orange-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Parent Pick-Up</span>
            </button>
          </div>

          {/* Right Action Icons: Small Screen / Fullscreen toggle + Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Switch to Small Screen' : 'Switch to Fullscreen'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Dedicated Scanner"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Center: Camera Viewfinder */}
        <div className="flex-1 p-3 sm:p-5 flex flex-col justify-center items-center relative overflow-hidden">
          <div
            className={`relative w-full overflow-hidden rounded-3xl border-2 transition-all flex items-center justify-center bg-black ${
              kioskMode === 'checkout' ? 'border-[#FF6F00]' : 'border-[#29C5E8]'
            } ${isFullscreen ? 'max-w-2xl max-h-[58vh] aspect-[4/3] sm:aspect-video' : 'max-h-72 aspect-[4/3]'}`}
          >
            {useCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Camera turned off. Use text box below.</p>
              </div>
            )}

            {/* Targeting Reticle Frame */}
            <div className="absolute inset-5 sm:inset-8 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-3 border-l-3 border-[#29C5E8] rounded-tl-lg" />
                <div className="w-6 h-6 border-t-3 border-r-3 border-[#FF6F00] rounded-tr-lg" />
              </div>
              <div className="text-center">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm">
                  Point QR or Barcode
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-3 border-l-3 border-[#FF6F00] rounded-bl-lg" />
                <div className="w-6 h-6 border-b-3 border-r-3 border-[#29C5E8] rounded-br-lg" />
              </div>
            </div>

            {/* Camera Switcher */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={toggleCameraLens}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Switch Lens"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 text-center text-xs text-rose-400 z-10">
                {cameraError}
              </div>
            )}
          </div>

          {/* Instant Scan Result Notification Pill */}
          {lastResult && (
            <div
              className={`mt-3 w-full max-w-md p-3 rounded-2xl border-2 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                lastResult.actionType === 'error'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                  : lastResult.actionType === 'checkout'
                  ? 'bg-orange-950/80 border-[#FF6F00] text-orange-100'
                  : 'bg-cyan-950/80 border-[#29C5E8] text-cyan-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {lastResult.kid?.avatarUrl && (
                  <img
                    src={lastResult.kid.avatarUrl}
                    alt={lastResult.kid.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-black truncate">
                    {lastResult.kid ? lastResult.kid.name : 'Notice'}
                  </div>
                  <div className="text-[11px] opacity-90 truncate">{lastResult.message}</div>
                </div>
              </div>

              {lastResult.securityCode && (
                <div className="font-mono text-xs font-black bg-black px-2.5 py-1 rounded-xl border border-white/20 text-[#FF6F00] shrink-0">
                  {lastResult.securityCode}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Text box for encoding name and security code */}
        <div className="p-3 sm:p-5 border-t border-slate-800 bg-slate-900/90">
          <form onSubmit={handleManualSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <input
              ref={inputRef}
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={
                kioskMode === 'checkin'
                  ? 'Encode child name, nickname, or security code (e.g. NXT-801)...'
                  : 'Encode name or claim code to pick up (e.g. NXT-801)...'
              }
              className="flex-1 min-w-0 w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#29C5E8] font-bold"
            />
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className={`w-full sm:w-auto shrink-0 px-5 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                kioskMode === 'checkin'
                  ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-md'
                  : 'bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white shadow-md shadow-orange-500/40'
              }`}
            >
              <span>{kioskMode === 'checkin' ? 'Check-In' : 'Pick-Up'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

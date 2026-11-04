import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scan,
  Camera,
  CameraOff,
  Keyboard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  LogIn,
  ShieldCheck,
  Search,
  Cake,
  QrCode,
  Barcode,
  RefreshCw,
  Zap,
  Cloud,
  Maximize2,
} from 'lucide-react';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { useAttendance, CheckInResult } from '../context/AttendanceContext';
import { NXTGEN_LEVELS, getLevelDetails } from '../types/attendance';
import { DedicatedScannerModal } from './DedicatedScannerModal';
import { BackupAndSyncModal } from './BackupAndSyncModal';

export const KioskScanner: React.FC = () => {
  const {
    kids,
    volunteers,
    records,
    settings,
    activeService,
    selectedSunday,
    checkInKid,
    checkOutKid,
    checkInVolunteer,
  } = useAttendance();

  const [inputCode, setInputCode] = useState<string>('');
  const [kioskMode, setKioskMode] = useState<'checkin' | 'checkout'>('checkin');
  const [scanMethod, setScanMethod] = useState<'camera' | 'usb_scanner' | 'manual'>('camera');
  const [claimTagInput, setClaimTagInput] = useState<string>('');
  const [useCamera, setUseCamera] = useState<boolean>(true); // Default to camera on mobile/tablet
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isDedicatedScannerOpen, setIsDedicatedScannerOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const processScanCodeRef = useRef<(code: string) => void>(() => {});
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Focus input for USB barcode guns / manual entry
  useEffect(() => {
    if (scanMethod !== 'camera') {
      inputRef.current?.focus();
    }
  }, [lastResult, kioskMode, scanMethod]);

  // Enumerate cameras (specifically back cameras on Android phones)
  useEffect(() => {
    const getCameras = async () => {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 0 && !selectedCameraId) {
            // Prefer back/rear environment camera for Android phone barcode scanning
            const backCam = videoDevices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
          }
        }
      } catch {
        // Ignored
      }
    };
    getCameras();
  }, [selectedCameraId]);

  // Core scan execution handler for barcode & QR input
  const processScanCode = useCallback(
    (scannedText: string) => {
      const cleanInput = scannedText.trim();
      if (!cleanInput) return;

      // Debounce: prevent duplicate scan of identical code within 2 seconds
      const now = Date.now();
      if (
        lastScannedTimeRef.current.code.toUpperCase() === cleanInput.toUpperCase() &&
        now - lastScannedTimeRef.current.time < 2000
      ) {
        return;
      }
      lastScannedTimeRef.current = { code: cleanInput, time: now };

      // Haptic feedback for Android phone
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([60, 40, 60]);
        } catch {}
      }

      setScannedFeedback(cleanInput);
      setTimeout(() => setScannedFeedback(null), 1800);

      // 1. Check if the scanned QR code belongs to a Lifeshaper / Teacher
      const matchedVolunteer = volunteers.find(
        (v) =>
          v.id.toUpperCase() === cleanInput.toUpperCase() ||
          v.name.toUpperCase().includes(cleanInput.toUpperCase())
      );

      if (matchedVolunteer && kioskMode === 'checkin') {
        checkInVolunteer(matchedVolunteer.id);
        setLastResult({
          success: true,
          message: `Welcome, Teacher ${matchedVolunteer.name}! Checked in for Sunday duty.`,
          actionType: 'checkin',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
        });
        setInputCode('');
        setClaimTagInput('');
        return;
      }

      // 2. Child Check-In or Pick-Up
      if (kioskMode === 'checkin') {
        const res = checkInKid(cleanInput);
        setLastResult(res);
      } else {
        // Pick-up / Parent Claim Mode
        const matchedKid = kids.find(
          (k) =>
            k.id.toUpperCase() === cleanInput.toUpperCase() ||
            k.securityCode.toUpperCase() === cleanInput.toUpperCase() ||
            k.name.toUpperCase().includes(cleanInput.toUpperCase())
        );

        if (!matchedKid) {
          setLastResult({
            success: false,
            message: `Child or claim code not found for "${cleanInput}"`,
            actionType: 'error',
          });
          return;
        }

        const res = checkOutKid(matchedKid.id, cleanInput);
        setLastResult(res);
      }

      setInputCode('');
      setClaimTagInput('');
    },
    [volunteers, kioskMode, kids, checkInVolunteer, checkInKid, checkOutKid]
  );

  // Sync latest processScanCode callback to ref to avoid restarting camera on attendance updates
  useEffect(() => {
    processScanCodeRef.current = processScanCode;
  }, [processScanCode]);

  // Continuous Camera QR & Barcode Auto-Detection without ImageCapture.setPhotoOptions
  useEffect(() => {
    let isActive = true;
    let scanTimer: ReturnType<typeof setInterval> | null = null;

    const stopStream = () => {
      if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
      }
      if (activeStreamRef.current) {
        try {
          activeStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
        activeStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startScanner = async () => {
      if (!useCamera || scanMethod !== 'camera' || !videoRef.current) {
        return;
      }

      setCameraError(null);

      try {
        const videoConstraints: MediaTrackConstraints = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        // Obtain camera stream cleanly without third-party torch/photo options
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        });

        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay catch
          }
        }

        // Initialize Native BarcodeDetector (Supported in Android Chrome & modern Chromium)
        type BarcodeDetectorType = {
          detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
        };
        let nativeDetector: BarcodeDetectorType | null = null;
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const BD = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => BarcodeDetectorType }).BarcodeDetector;
            nativeDetector = new BD({
              formats: [
                'qr_code',
                'code_128',
                'code_39',
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e',
                'itf',
                'codabar',
              ],
            });
          } catch {
            nativeDetector = null;
          }
        }

        // Pure JavaScript ZXing MultiFormatReader fallback for in-memory pixel decoding
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const zxingReader = new MultiFormatReader();
        zxingReader.setHints(hints);

        // Offscreen canvas for frame capture
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let isProcessingFrame = false;

        const scanFrame = async () => {
          if (!isActive || isProcessingFrame || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
            return;
          }

          isProcessingFrame = true;
          try {
            if (nativeDetector) {
              const barcodes = await nativeDetector.detect(video);
              if (isActive && barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (code) {
                  processScanCodeRef.current(code);
                }
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
                  processScanCodeRef.current(result.getText());
                }
              } catch {
                // Expected when current frame has no barcode in focus
              } finally {
                zxingReader.reset();
              }
            }
          } catch {
            // Safely skip any single-frame detection exceptions
          } finally {
            isProcessingFrame = false;
          }
        };

        // Scan every 180ms for responsive continuous scanning without CPU strain
        scanTimer = setInterval(scanFrame, 180);
      } catch (err: unknown) {
        if (!isActive) return;
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(
          `Camera scanner error: ${msg}. Make sure camera permissions are enabled in Android settings.`
        );
      }
    };

    if (useCamera && scanMethod === 'camera') {
      startScanner();
    }

    return () => {
      isActive = false;
      stopStream();
    };
  }, [useCamera, scanMethod, selectedCameraId]);

  // Flip / switch camera (front vs rear)
  const toggleCameraLens = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setSelectedCameraId(availableCameras[nextIndex].deviceId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    processScanCode(inputCode);
  };

  const handleQuickCheckIn = (kidId: string) => {
    processScanCode(kidId);
  };

  // 1 Demo Kid from each of the 5 Levels for rapid testing
  const sampleDemoKids = [
    kids.find((k) => k.calculatedLevelId === 'aquarium'),
    kids.find((k) => k.calculatedLevelId === 'level_1'),
    kids.find((k) => k.calculatedLevelId === 'level_2'),
    kids.find((k) => k.calculatedLevelId === 'level_3'),
    kids.find((k) => k.calculatedLevelId === 'level_4'),
  ].filter(Boolean);

  // Birthday celebration spotlight
  const now = new Date();
  const todayKidsBirthdays = kids.filter((k) => {
    if (!k.birthDate) return false;
    const d = new Date(k.birthDate);
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  return (
    <div className="space-y-6 max-w-full">
      {/* Birthday Celebration Banner if any child has birthday today */}
      {todayKidsBirthdays.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-orange-500/15 via-pink-500/10 to-cyan-500/15 border-2 border-[#FF6F00] shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6F00] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Cake className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-[#FF6F00] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sunday Birthday Spotlight!
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Happy Birthday to {todayKidsBirthdays.map((k) => k.name).join(', ')}! Give them an extra warm NXTGEN high-five today!
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-xs font-black text-[#FF6F00] border border-orange-200 dark:border-orange-500/30">
            🎉 Birthday Hero
          </span>
        </div>
      )}

      {/* Kiosk Hero Banner - Responsive on Mobile & Desktop */}
      <div className={`rounded-3xl p-4 sm:p-7 border shadow-sm relative overflow-hidden transition-all ${
        kioskMode === 'checkout'
          ? 'bg-white dark:bg-slate-900 border-2 border-[#FF6F00] ring-4 ring-orange-500/15 shadow-orange-500/10'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border-2 shadow-sm flex-shrink-0 flex items-center justify-center transition-colors ${
              kioskMode === 'checkout' ? 'border-[#FF6F00] ring-2 ring-orange-500/30' : 'border-[#FF6F00]'
            }`}>
              <img
                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                alt="NXTGEN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                  kioskMode === 'checkout'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                    : 'bg-cyan-50 dark:bg-[#29C5E8]/20 text-[#0284c7] dark:text-[#29C5E8] border-cyan-200 dark:border-[#29C5E8]/40'
                }`}>
                  {kioskMode === 'checkout' ? '🛡️ PARENT PICK-UP MODE ACTIVE' : 'SUNDAY CHECK-IN & PICK-UP'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-orange-50 dark:bg-[#FF6F00]/20 text-[#FF6F00] border border-orange-200 dark:border-[#FF6F00]/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF6F00] animate-ping"></span>
                  {activeService}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {kioskMode === 'checkout' ? 'Parent Pick-Up & Claim Verification' : 'Kiosk Check-In & Parent Pick-Up'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                {kioskMode === 'checkout'
                  ? 'Verify parent security claim tickets (e.g. NXT-801) before releasing kids. Point camera at parent claim barcode or QR.'
                  : 'Automatic room placement by birth year. Point your Android phone camera at the QR code or barcode for hands-free instant scanning.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher: Check-in vs Parent Pick-up (Fluid Flexbox for Mobile & Tablet) */}
          <div className={`p-1.5 rounded-2xl border flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto transition-all ${
            kioskMode === 'checkout'
              ? 'bg-orange-500/10 border-orange-300 dark:border-orange-500/30'
              : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
          }`}>
            <button
              onClick={() => {
                setKioskMode('checkin');
                setLastResult(null);
              }}
              className={`flex-1 w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                kioskMode === 'checkin'
                  ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>1. Check-In</span>
            </button>
            <button
              onClick={() => {
                setKioskMode('checkout');
                setLastResult(null);
              }}
              className={`flex-1 w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                kioskMode === 'checkout'
                  ? 'bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white shadow-md shadow-orange-500/40 ring-2 ring-orange-400 animate-in zoom-in-95'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>2. Parent Pick-Up</span>
            </button>
          </div>
        </div>

        {/* 5 Levels Quick Indicator */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {NXTGEN_LEVELS.map((level) => (
            <div
              key={level.id}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="font-black text-slate-900 dark:text-white truncate">{level.name}</div>
              <div className="font-bold text-[11px] text-[#0284c7] dark:text-cyan-300 mt-0.5">{level.ageRange}</div>
              <div className="text-[10px] text-slate-400 truncate">{level.ratioGuidelines}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Kiosk Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input, Camera Scanner, Quick Test (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <div className={`rounded-3xl p-4 sm:p-6 shadow-sm transition-all ${
            kioskMode === 'checkout'
              ? 'bg-white dark:bg-slate-900 border-2 border-[#FF6F00] shadow-orange-500/10'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
          }`}>
            {/* Scan Method Switcher: Camera Auto-Scan vs Handheld USB vs Manual */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-[#29C5E8]" />
                Scanning Device Option:
              </div>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setScanMethod('camera');
                    setUseCamera(true);
                  }}
                  className={`w-full sm:flex-1 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scanMethod === 'camera'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Phone Camera / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScanMethod('usb_scanner');
                    setUseCamera(false);
                    inputRef.current?.focus();
                  }}
                  className={`w-full sm:flex-1 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scanMethod === 'usb_scanner'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>USB Barcode Gun</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScanMethod('manual');
                    setUseCamera(false);
                    inputRef.current?.focus();
                  }}
                  className={`w-full sm:flex-1 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scanMethod === 'manual'
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Manual Input</span>
                </button>
              </div>
            </div>

            {/* LIVE CAMERA VIEWFINDER (Mobile Phone & Tablet Optimized) */}
            <div className="relative aspect-[4/3] sm:aspect-video max-h-72 w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {useCamera && scanMethod === 'camera' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Scanned Feedback Overlay */}
                  {scannedFeedback && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center animate-pulse z-20">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500 shadow-2xl flex items-center gap-2 text-xs font-black text-emerald-600">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Scanned: {scannedFeedback}</span>
                      </div>
                    </div>
                  )}

                  {/* Camera Switcher Controls on Mobile */}
                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleCameraLens}
                      className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      title="Switch Front/Rear Camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">Flip Lens</span>
                    </button>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 text-center text-xs text-rose-400 z-10">
                      {cameraError}
                    </div>
                  )}

                  {/* Targeting HUD overlay */}
                  <div className="absolute inset-6 border border-cyan-400/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-3 border-l-3 border-[#29C5E8] rounded-tl-lg"></div>
                      <div className="w-5 h-5 border-t-3 border-r-3 border-[#FF6F00] rounded-tr-lg"></div>
                    </div>
                    <div className="text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-[#29C5E8] border border-cyan-400/30 backdrop-blur-sm">
                        Align Barcode / QR Inside Box
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-3 border-l-3 border-[#FF6F00] rounded-bl-lg"></div>
                      <div className="w-5 h-5 border-b-3 border-r-3 border-[#29C5E8] rounded-br-lg"></div>
                    </div>
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#29C5E8] to-transparent shadow-[0_0_12px_#29C5E8] animate-[bounce_1.8s_infinite]"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border-2 border-dashed border-cyan-400/60 flex items-center justify-center mx-auto mb-3">
                    {scanMethod === 'usb_scanner' ? (
                      <Barcode className="w-8 h-8 text-[#FF6F00]" />
                    ) : (
                      <Keyboard className="w-8 h-8 text-[#29C5E8]" />
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    {scanMethod === 'usb_scanner'
                      ? 'Ready for USB / Handheld Barcode Scanner'
                      : 'Manual Keypad Entry Mode'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mx-auto">
                    {scanMethod === 'usb_scanner'
                      ? 'Point barcode scanner gun at the child or parent badge. Scans submit automatically!'
                      : 'Type child name, security code (e.g. NXT-801), or phone number.'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Camera Toggle Action Bar */}
            <div className="flex items-center justify-between pt-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Automatic scanning is active while camera is on.
              </span>
              <button
                type="button"
                onClick={() => setUseCamera(!useCamera)}
                className="text-xs font-bold text-[#0284c7] dark:text-[#29C5E8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {useCamera ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{useCamera ? 'Turn Camera Off' : 'Turn Camera On'}</span>
              </button>
            </div>

            {/* Input Form for Manual and Barcode Reader submission */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {kioskMode === 'checkin'
                  ? 'Manual Search (Name, Security Tag NXT-..., or Parent Phone):'
                  : 'Enter Child Name or Security Claim Tag to Pick Up:'}
              </label>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={
                    kioskMode === 'checkin'
                      ? 'e.g. Liam, Chloe, NXT-801, or 0917...'
                      : 'Child name or tag (e.g. NXT-801)'
                  }
                  className="flex-1 min-w-0 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#29C5E8] focus:ring-2 focus:ring-cyan-500/20 text-sm"
                />

                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className={`w-full sm:w-auto shrink-0 px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                    kioskMode === 'checkin'
                      ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-cyan-500/30'
                      : 'bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white shadow-orange-500/30'
                  }`}
                >
                  <span>{kioskMode === 'checkin' ? 'Check-In' : 'Release'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </form>

            {/* Quick 1-Click Demo Child Cards */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6F00]" />
                  Quick Test Kids (5 Sunday Levels):
                </span>
                <span className="text-[11px] text-[#0284c7] dark:text-[#29C5E8] font-bold">Tap to test</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
                {sampleDemoKids.map((kid) => {
                  if (!kid) return null;
                  const level = getLevelDetails(kid.calculatedLevelId);
                  const isChecked = records.some(
                    (r) =>
                      r.kidId === kid.id &&
                      r.sundayDate === selectedSunday &&
                      r.serviceName === activeService &&
                      r.status === 'present'
                  );

                  return (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => handleQuickCheckIn(kid.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                        isChecked
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-500/60'
                          : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-[#FF6F00]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={kid.avatarUrl}
                          alt={kid.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#29C5E8] truncate">
                            {kid.nickname || kid.name.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {kid.securityCode}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded truncate border"
                          style={{
                            backgroundColor: `${level.color}15`,
                            color: level.color,
                            borderColor: `${level.color}40`,
                          }}
                        >
                          {level.name}
                        </span>
                        {isChecked ? (
                          <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 flex items-center">
                            ✓ In
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#FF6F00] font-bold">+ In</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Feedback Card with Security Tag Badge */}
          {lastResult && (
            <div
              className={`rounded-3xl p-5 sm:p-6 border-2 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
                lastResult.actionType === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500'
                  : lastResult.actionType === 'checkout'
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-[#FF6F00]'
                  : 'bg-cyan-50/80 dark:bg-cyan-950/40 border-[#29C5E8]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {lastResult.kid ? (
                    <img
                      src={lastResult.kid.avatarUrl}
                      alt={lastResult.kid.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-white dark:border-white/20 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {lastResult.actionType === 'checkin' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#29C5E8] text-white flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-4 h-4" /> CHECKED IN
                        </span>
                      )}
                      {lastResult.actionType === 'checkout' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FF6F00] text-white flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-4 h-4" /> RELEASED TO PARENT
                        </span>
                      )}
                      {lastResult.actionType === 'duplicate' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900">
                          ALREADY CHECKED IN
                        </span>
                      )}
                      {lastResult.actionType === 'error' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white">
                          ATTENTION REQUIRED
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {lastResult.timestamp}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                      {lastResult.kid ? lastResult.kid.name : 'Notice'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 mt-1">{lastResult.message}</p>

                    {lastResult.kid && (() => {
                      const kidLvl = getLevelDetails(lastResult.kid.calculatedLevelId);
                      return (
                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                          <span
                            className="px-2.5 py-1 rounded-lg border font-black flex items-center gap-1.5 shadow-xs"
                            style={{
                              backgroundColor: `${kidLvl.color}20`,
                              color: kidLvl.color,
                              borderColor: `${kidLvl.color}60`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: kidLvl.color }}
                            />
                            {kidLvl.name} ({kidLvl.ageRange})
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                            Room:{' '}
                            <span className="font-semibold" style={{ color: kidLvl.color }}>
                              {kidLvl.roomName}
                            </span>
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                            Birth Year:{' '}
                            <span className="text-[#FF6F00] font-mono">{lastResult.kid.birthYear}</span>
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                            Parent: <span className="text-slate-900 dark:text-white">{lastResult.kid.parentName}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {lastResult.kid?.allergiesNotes && (
                      <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 font-medium">
                        ⚠️ <span className="font-bold">Care Alert / Allergy:</span>{' '}
                        {lastResult.kid.allergiesNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Security Claim Tag Callout */}
                {lastResult.securityCode && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border-2 border-[#FF6F00] text-center flex-shrink-0 self-center sm:self-start shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Parent Claim Tag
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#FF7A00] tracking-wider block mt-0.5">
                      {lastResult.securityCode}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Required for Pick-up
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Sunday Arrival Stream */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#29C5E8] animate-pulse"></span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Live Sunday Check-Ins</h3>
              </div>
              <span className="text-xs font-mono text-[#FF7A00] font-bold">
                {records.filter((r) => r.sundayDate === selectedSunday && r.serviceName === activeService && r.status === 'present').length} kids present
              </span>
            </div>

            {records.filter((r) => r.sundayDate === selectedSunday && r.serviceName === activeService).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No kids checked in yet today.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Ready for Sunday arrivals!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {records
                  .filter((r) => r.sundayDate === selectedSunday && r.serviceName === activeService)
                  .map((rec) => {
                    const kid = kids.find((k) => k.id === rec.kidId);
                    const level = getLevelDetails(rec.levelId);

                    return (
                      <div
                        key={rec.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {kid ? (
                            <img
                              src={kid.avatarUrl}
                              alt={kid.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <span className="text-xs">👶</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-slate-900 dark:text-white truncate">{kid?.name || 'Child'}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-[#0284c7] dark:text-[#29C5E8]">{level.name.split('/')[0]}</span>
                              <span>•</span>
                              <span>Born: {kid?.birthYear}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-mono text-[11px] font-black text-[#FF6F00] bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-500/20 block">
                            {rec.securityCode}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                            {rec.checkInTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Safety & Guidelines Info */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#29C5E8]" />
              NXTGEN Roxas Safety Policy
            </div>
            <p className="text-[11px] leading-relaxed">
              Children are strictly assigned to their levels by **Birth Year**. Never release a child without matching parent security ticket.
            </p>
          </div>
        </div>
      </div>

      {/* Dedicated Distraction-Free Kiosk Scanner Screen (Small Screen or Fullscreen) */}
      <DedicatedScannerModal
        isOpen={isDedicatedScannerOpen}
        onClose={() => setIsDedicatedScannerOpen(false)}
        defaultMode={kioskMode}
      />

      {/* Database Backup & Google Cloud Auto-Sync Modal */}
      <BackupAndSyncModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

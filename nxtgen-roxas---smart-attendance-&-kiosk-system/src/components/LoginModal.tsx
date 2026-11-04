import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { UserRole } from '../types/auth';
import { LevelId, Volunteer } from '../types/attendance';
import { resizeImageFile, backupPhotoToDriveIfConnected } from '../utils/imageUpload';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean; // When logged out or visiting website fresh
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { login, register } = useAuth();
  const { addVolunteer, volunteers } = useAttendance();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form fields
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Register form fields
  const [regFullName, setRegFullName] = useState<string>('');
  const [regIdentifier, setRegIdentifier] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAssignedRoom, setRegAssignedRoom] = useState<string>('Level 1');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regBirthDate, setRegBirthDate] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('volunteer');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  // Separate inputs for Gallery Upload vs Camera Selfie
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const compressedDataUrl = await resizeImageFile(file, 360, 360, 0.85);
      setRegAvatarUrl(compressedDataUrl);
      // Auto-save photo to Google Drive
      backupPhotoToDriveIfConnected(compressedDataUrl, `lifeshaper-${Date.now()}.jpg`);
      setFeedback({ type: 'success', message: 'Lifeshaper photo ready & saved to Google Drive!' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not process uploaded image.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!identifierInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your Email or Username.' });
      return;
    }
    if (!passwordInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your account password.' });
      return;
    }

    const res = login(identifierInput, passwordInput);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
      return;
    }

    setFeedback({ type: 'success', message: res.message });
    setTimeout(() => {
      if (onClose) onClose();
    }, 350);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!regFullName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!regIdentifier.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an Email or Username.' });
      return;
    }
    if (!regPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please create a secure password.' });
      return;
    }

    const res = register({
      name: regFullName,
      emailOrUsername: regIdentifier,
      password: regPassword,
      role: regRole,
      assignedRoom: regAssignedRoom,
      phone: regPhone,
      avatarUrl: regAvatarUrl || undefined,
    });

    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
      return;
    }

    // Only add to volunteers immediately if admin. Lifeshapers must be admitted by Admin first!
    const isLevelMatch = (lvlStr: string): LevelId | 'all' => {
      if (lvlStr.includes('Aquarium')) return 'aquarium';
      if (lvlStr.includes('1')) return 'level_1';
      if (lvlStr.includes('2')) return 'level_2';
      if (lvlStr.includes('3')) return 'level_3';
      if (lvlStr.includes('4')) return 'level_4';
      return 'all';
    };

    const alreadyInVolunteers = volunteers.some(
      (v) => v.name.toLowerCase() === regFullName.trim().toLowerCase()
    );

    if (regRole === 'admin') {
      if (!alreadyInVolunteers && res.user) {
        const newVol: Volunteer = {
          id: `VOL-${Math.floor(100 + Math.random() * 900)}`,
          name: regFullName.trim(),
          email: res.user.email,
          phone: regPhone || '+63 917 000 0000',
          role: 'coordinator',
          isMinistryCoordinator: true,
          avatarUrl: regAvatarUrl || res.user.avatarUrl,
          birthDate: regBirthDate || undefined,
          assignedLevel: isLevelMatch(regAssignedRoom),
          status: 'active',
          checkedInForSunday: false,
        };
        addVolunteer(newVol);
      }

      setFeedback({
        type: 'success',
        message: `Admin account registered successfully! Welcome, ${regFullName}.`,
      });

      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } else {
      // Lifeshaper / Volunteer account requires Admin Confirmation first!
      setFeedback({
        type: 'success',
        message: `Registration submitted! Admin Arjay Aguirre must confirm and approve your Lifeshaper account first before you can log in.`,
      });
      setIdentifierInput(regIdentifier);
      setMode('login');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto ${
        isMandatory
          ? 'bg-gradient-to-br from-[#0c1829] via-[#0F172A] to-[#082f49]'
          : 'bg-black/80 backdrop-blur-md'
      }`}
    >
      {/* Background brand ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#29C5E8]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-[#FF6F00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white dark:bg-slate-900 border-2 border-[#29C5E8]/40 dark:border-[#29C5E8]/30 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl shadow-[#29C5E8]/10 space-y-4 my-auto animate-in fade-in zoom-in-95 transition-all">
        
        {/* Optional Close Button (only allowed if already authenticated and just switching) */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* System Branding & Logo Header with Blue Hex (#29C5E8) Focus */}
        <div className="text-center space-y-2.5">
          <div className="relative inline-block">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 border-2 border-[#29C5E8] shadow-lg shadow-cyan-500/20 mx-auto flex items-center justify-center">
              <img
                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                alt="NXTGEN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6F00] text-white flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-[#29C5E8]/30 text-[#0284c7] dark:text-[#29C5E8] text-[10px] font-black uppercase tracking-wider mb-1">
              CCF Roxas • Kids Church
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              NXTGEN Attendance System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Please sign in to access Sunday attendance and student check-in
            </p>
          </div>
        </div>

        {/* Tab Toggle: Sign In vs Register Teacher / Lifeshaper */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Lifeshaper</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in ${
              feedback.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* ----------------- MODE 1: MOBILE OPTIMIZED SIGN IN ----------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-3">
              {/* Field 1: Email or Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#29C5E8]" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. arjay.aguirre or teacher@nxtgen.church"
                    value={identifierInput}
                    onChange={(e) => {
                      setIdentifierInput(e.target.value);
                      setFeedback(null);
                    }}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#29C5E8] focus:ring-2 focus:ring-[#29C5E8]/30 transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#29C5E8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter account password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setFeedback(null);
                    }}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#29C5E8] focus:ring-2 focus:ring-[#29C5E8]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: Mobile High Touch-Target */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] hover:from-[#22b7d9] hover:to-[#0369a1] text-white font-black text-xs shadow-md shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to System</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFeedback(null);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border-2 border-[#FF6F00] text-[#FF6F00] hover:bg-[#FF6F00] hover:text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center space-y-1">
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                NXTGEN Roxas Attendance Management System
              </p>
              <p className="text-[10px] text-slate-400">
                Registered Lifeshaper accounts must be confirmed by the Admin before sign-in.
              </p>
            </div>
          </form>
        )}

        {/* ----------------- MODE 2: TEACHER / LIFESHAPER REGISTRATION ----------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-[#FF6F00]/25 text-[11px] text-[#ea580c] dark:text-[#FF7A00] font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Admin Arjay Aguirre will confirm your registered Lifeshaper account first before access.</span>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {/* Photo Upload Section for Lifeshaper: Separated Upload Photo & Take Selfie Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lifeshaper Profile Photo (Saved to Google Drive)
                </label>
                
                {/* Hidden File Inputs: Gallery vs Camera */}
                <input
                  type="file"
                  ref={galleryFileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraFileInputRef}
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="relative shrink-0">
                    {regAvatarUrl ? (
                      <img
                        src={regAvatarUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#29C5E8] shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-col sm:flex-row items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isProcessingPhoto}
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="w-full sm:flex-1 py-2 px-2 rounded-xl bg-[#29C5E8]/10 hover:bg-[#29C5E8]/20 border border-[#29C5E8]/40 text-[#0284c7] dark:text-[#29C5E8] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessingPhoto}
                        onClick={() => cameraFileInputRef.current?.click()}
                        className="w-full sm:flex-1 py-2 px-2 rounded-xl bg-[#FF6F00]/10 hover:bg-[#FF6F00]/20 border border-[#FF6F00]/40 text-[#ea580c] dark:text-[#FF7A00] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Selfie</span>
                      </button>
                    </div>

                    {regAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setRegAvatarUrl('')}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full cursor-pointer"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teacher Angela Cruz"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6F00]"
                />
              </div>

              {/* Email or Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. angela.cruz or angela@nxtgen.church"
                  value={regIdentifier}
                  onChange={(e) => setRegIdentifier(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6F00]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Create a secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6F00]"
                />
              </div>

              {/* Assigned Room & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Level / Room
                  </label>
                  <select
                    value={regAssignedRoom}
                    onChange={(e) => setRegAssignedRoom(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6F00]"
                  >
                    <option value="Aquarium Room">Aquarium / Tot's (1-3)</option>
                    <option value="Level 1">Level 1 (Ages 4-5)</option>
                    <option value="Level 2">Level 2 (Ages 6-7)</option>
                    <option value="Level 3">Level 3 (Ages 8-9)</option>
                    <option value="Level 4">Level 4 (Ages 10-12)</option>
                    <option value="Welcome Station">Welcome & Greeter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6F00]"
                  >
                    <option value="volunteer">Lifeshaper / Teacher</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              {/* Optional Phone & Birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+63 917 000 0000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF6F00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Birthday (Optional)
                  </label>
                  <input
                    type="date"
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6F00]"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: Fluid Flexbox for Mobile */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6F00] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-black text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit Lifeshaper Registration</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFeedback(null);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer text-center"
              >
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

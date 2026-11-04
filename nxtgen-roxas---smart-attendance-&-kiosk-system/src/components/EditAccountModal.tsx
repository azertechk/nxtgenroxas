import React, { useState, useEffect, useRef } from 'react';
import { X, UserCheck, ShieldCheck, Mail, Phone, Lock, Save, Camera, Sparkles, Building, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NXTGEN_LEVELS } from '../types/attendance';
import { resizeImageFile, backupPhotoToDriveIfConnected } from '../utils/imageUpload';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUserAccount, isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [assignedRoom, setAssignedRoom] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dgroupLeaderName, setDgroupLeaderName] = useState('');
  const [dgroupLeaderPhone, setDgroupLeaderPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await resizeImageFile(file, 360, 360, 0.85);
      setAvatarUrl(compressed);
      if (currentUser) {
        backupPhotoToDriveIfConnected(compressed, `profile-${currentUser.id}-${Date.now()}.jpg`);
      }
      setStatusMsg({ type: 'success', text: 'Photo ready & backed up to Google Drive! Click Save Changes.' });
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Could not process photo.' });
    }
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setUsername(currentUser.username || '');
      setPhone(currentUser.phone || '');
      setPassword(currentUser.password || '');
      setAssignedRoom(currentUser.assignedRoom || 'Level 1');
      setAvatarUrl(currentUser.avatarUrl || '');
      setDgroupLeaderName(currentUser.dgroupLeaderName || '');
      setDgroupLeaderPhone(currentUser.dgroupLeaderPhone || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Full name is required.' });
      return;
    }
    if (!email.trim()) {
      setStatusMsg({ type: 'error', text: 'Email is required.' });
      return;
    }

    const res = updateCurrentUserAccount({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase() || email.trim().split('@')[0],
      phone: phone.trim(),
      password: password || 'password123',
      assignedRoom,
      avatarUrl: avatarUrl || currentUser.avatarUrl,
      dgroupLeaderName: dgroupLeaderName.trim(),
      dgroupLeaderPhone: dgroupLeaderPhone.trim(),
    });

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Account profile updated successfully!' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-[#0284c7] dark:text-[#29C5E8] flex items-center justify-center flex-shrink-0 border border-cyan-200 dark:border-cyan-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Edit My Account
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-[#0284c7]/10 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isAdmin ? 'Administrator' : 'Lifeshaper'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your login credentials, personal contact, and assigned room
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar selector with upload */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#29C5E8]" />
                Profile Photo / Avatar
              </label>
            </div>

            {/* Hidden File Inputs: Gallery vs Camera */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="user"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <img
                src={avatarUrl || currentUser.avatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#29C5E8] shadow-sm flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full sm:flex-1 py-1.5 px-2.5 rounded-xl bg-[#29C5E8]/10 hover:bg-[#29C5E8]/20 border border-[#29C5E8]/40 text-[#0284c7] dark:text-[#29C5E8] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:flex-1 py-1.5 px-2.5 rounded-xl bg-[#FF6F00]/10 hover:bg-[#FF6F00]/20 border border-[#FF6F00]/40 text-[#ea580c] dark:text-[#FF7A00] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Selfie</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sampleAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border-2 cursor-pointer transition-transform ${
                        avatarUrl === url
                          ? 'border-[#FF6F00] scale-105 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#29C5E8]"
                placeholder="Arjay Aguirre"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#29C5E8]"
                placeholder="arjay.aguirre"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#29C5E8]" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#29C5E8]"
                placeholder="name@hercorcollege.edu.ph"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-500" />
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#29C5E8]"
                placeholder="+63 917 123 4567"
              />
            </div>
          </div>

          {/* Assigned Room & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-[#FF6F00]" />
                Assigned Room / Level
              </label>
              <select
                value={assignedRoom}
                onChange={(e) => setAssignedRoom(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#29C5E8]"
              >
                <option value="All Rooms">All Rooms (Service Wide)</option>
                {NXTGEN_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.name}>
                    {lvl.name} ({lvl.ageRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-500" />
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#29C5E8]"
                placeholder="Leave or set new password"
              />
            </div>
          </div>

          {/* DGroup Leader Details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Discipleship Group (DGroup) Leader
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Name of DGroup Leader:
                </label>
                <input
                  type="text"
                  value={dgroupLeaderName}
                  onChange={(e) => setDgroupLeaderName(e.target.value)}
                  className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#29C5E8]"
                  placeholder="e.g. Pastor Joel / Sis. Elena"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Contact Number of DGroup Leader:
                </label>
                <input
                  type="tel"
                  value={dgroupLeaderPhone}
                  onChange={(e) => setDgroupLeaderPhone(e.target.value)}
                  className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#29C5E8]"
                  placeholder="e.g. +63 917 888 1234"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer hover:opacity-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

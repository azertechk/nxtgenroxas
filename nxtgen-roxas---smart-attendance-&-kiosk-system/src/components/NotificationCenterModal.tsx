import React, { useState } from 'react';
import {
  X,
  Bell,
  Cake,
  CheckCircle2,
  Clock,
  Sparkles,
  Gift,
  HeartHandshake,
  UserCheck,
  Scan,
  ShieldCheck,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { KidMember, Volunteer, LiveNotification, getLevelDetails } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import { getBirthdayList } from './BirthdayNotificationsModal';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: KidMember[];
  volunteers: Volunteer[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  kids,
  volunteers,
}) => {
  const { notifications, markAllNotificationsRead, clearNotifications } = useAttendance();
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'birthdays'>('all');

  if (!isOpen) return null;

  const { todayBirthdays, upcomingThisWeek, thisMonthBirthdays } = getBirthdayList(kids, volunteers);
  const totalBirthdays = todayBirthdays.length + upcomingThisWeek.length + thisMonthBirthdays.length;

  const triggerBirthdayConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF6F00', '#29C5E8', '#ec4899', '#facc15'],
      });
    } catch {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'activity') return n.type !== 'birthday';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-[#FF6F00] flex items-center justify-center flex-shrink-0 border border-orange-200 dark:border-orange-500/30">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Live Notifications & Activity
                {todayBirthdays.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase animate-bounce">
                    🎉 Birthday Today!
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time Sunday check-ins, parent pick-ups, and birthday milestones
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

        {/* Action Controls & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Events ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Check-In / Pick-Up
            </button>
            <button
              onClick={() => setActiveTab('birthdays')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'birthdays'
                  ? 'bg-white dark:bg-slate-800 text-[#FF6F00] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#FF6F00]'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              Birthdays ({totalBirthdays})
            </button>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-center">
            <button
              onClick={markAllNotificationsRead}
              title="Mark all notifications as read"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark Read</span>
            </button>
            <button
              onClick={clearNotifications}
              title="Clear notification list"
              className="p-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab !== 'birthdays' ? (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No activity notifications yet today.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isKidCheckin = notif.type === 'kid_checkin';
                const isKidCheckout = notif.type === 'kid_checkout';
                const isLifeshaper = notif.type === 'lifeshaper_checkin';

                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 text-xs ${
                      !notif.read
                        ? 'bg-slate-50 dark:bg-slate-950/90 border-[#29C5E8]/40 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isKidCheckin
                          ? 'bg-cyan-500/15 text-[#29C5E8]'
                          : isKidCheckout
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : isLifeshaper
                          ? 'bg-[#FF6F00]/15 text-[#FF6F00]'
                          : 'bg-slate-500/15 text-slate-500'
                      }`}
                    >
                      {isKidCheckin && <Scan className="w-4 h-4" />}
                      {isKidCheckout && <ShieldCheck className="w-4 h-4" />}
                      {isLifeshaper && <HeartHandshake className="w-4 h-4" />}
                      {!isKidCheckin && !isKidCheckout && !isLifeshaper && <Bell className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Birthday List View */
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {/* Today's Celebrants */}
            {todayBirthdays.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-cyan-500/10 border-2 border-[#FF6F00] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6F00] animate-spin" />
                    <span className="font-black text-xs text-[#FF6F00] uppercase tracking-wider">
                      Today's Birthday Celebrant!
                    </span>
                  </div>
                  <button
                    onClick={triggerBirthdayConfetti}
                    className="px-2.5 py-1 rounded-lg bg-[#FF6F00] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:opacity-90"
                  >
                    🎉 Celebrate
                  </button>
                </div>

                <div className="space-y-2">
                  {todayBirthdays.map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-9 h-9 rounded-xl object-cover border border-[#FF6F00]"
                        />
                        <div>
                          <div className="font-black text-xs text-slate-900 dark:text-white">
                            {person.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {person.roleOrLevel} • Turning {person.turningAge || ''} today!
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        Happy Birthday!
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming This Week */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                Upcoming Celebrations This Week
              </span>
              <div className="space-y-2">
                {upcomingThisWeek.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No other birthdays this week.</p>
                ) : (
                  upcomingThisWeek.map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {person.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {person.roleOrLevel} • In {person.daysUntil} day{person.daysUntil === 1 ? '' : 's'} ({person.formattedDate})
                          </div>
                        </div>
                      </div>
                      <Gift className="w-4 h-4 text-[#29C5E8]" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>NXTGEN Roxas Live Notification Feed</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

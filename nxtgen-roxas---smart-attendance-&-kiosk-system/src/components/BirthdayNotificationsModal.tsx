import React from 'react';
import { X, Cake, Sparkles, Gift, Heart, Calendar, Phone, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { KidMember, Volunteer, getLevelDetails } from '../types/attendance';

export interface BirthdayItem {
  id: string;
  name: string;
  avatarUrl: string;
  birthDate: string;
  type: 'kid' | 'volunteer';
  roleOrLevel: string;
  parentOrContact?: string;
  isToday: boolean;
  isThisWeek: boolean;
  turningAge?: number;
  formattedDate: string;
  daysUntil: number;
}

interface BirthdayNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: KidMember[];
  volunteers: Volunteer[];
}

export function getBirthdayList(kids: KidMember[], volunteers: Volunteer[]): {
  todayBirthdays: BirthdayItem[];
  upcomingThisWeek: BirthdayItem[];
  thisMonthBirthdays: BirthdayItem[];
} {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  const allItems: BirthdayItem[] = [];

  // Helper to parse and calculate
  const processPerson = (
    id: string,
    name: string,
    avatarUrl: string,
    birthDateStr: string | undefined,
    type: 'kid' | 'volunteer',
    roleOrLevel: string,
    parentOrContact?: string
  ) => {
    if (!birthDateStr) return;
    const bDate = new Date(birthDateStr);
    if (isNaN(bDate.getTime())) return;

    const bMonth = bDate.getMonth();
    const bDay = bDate.getDate();
    const bYear = bDate.getFullYear();

    // Check if this month
    if (bMonth === currentMonth) {
      const isToday = bDay === currentDay;
      const daysUntil = bDay - currentDay;
      const isThisWeek = daysUntil >= 0 && daysUntil <= 7;
      const turningAge = currentYear - bYear;

      const formattedDate = bDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      allItems.push({
        id,
        name,
        avatarUrl,
        birthDate: birthDateStr,
        type,
        roleOrLevel,
        parentOrContact,
        isToday,
        isThisWeek,
        turningAge: turningAge > 0 ? turningAge : undefined,
        formattedDate,
        daysUntil,
      });
    }
  };

  kids.forEach((k) => {
    const lvl = getLevelDetails(k.calculatedLevelId);
    processPerson(
      k.id,
      k.name,
      k.avatarUrl,
      k.birthDate,
      'kid',
      lvl.name,
      `${k.parentName} (${k.parentPhone})`
    );
  });

  volunteers.forEach((v) => {
    processPerson(
      v.id,
      v.name,
      v.avatarUrl,
      v.birthDate,
      'volunteer',
      v.role.replace('_', ' ').toUpperCase(),
      v.phone
    );
  });

  // Sort by day of month
  allItems.sort((a, b) => a.daysUntil - b.daysUntil);

  const todayBirthdays = allItems.filter((i) => i.isToday);
  const upcomingThisWeek = allItems.filter((i) => !i.isToday && i.isThisWeek);
  const thisMonthBirthdays = allItems.filter((i) => !i.isToday && !i.isThisWeek && i.daysUntil >= 0);

  return { todayBirthdays, upcomingThisWeek, thisMonthBirthdays };
}

export const BirthdayNotificationsModal: React.FC<BirthdayNotificationsModalProps> = ({
  isOpen,
  onClose,
  kids,
  volunteers,
}) => {
  if (!isOpen) return null;

  const { todayBirthdays, upcomingThisWeek, thisMonthBirthdays } = getBirthdayList(kids, volunteers);

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

  const totalCount = todayBirthdays.length + upcomingThisWeek.length + thisMonthBirthdays.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-[#FF6F00] flex items-center justify-center flex-shrink-0 border border-orange-200 dark:border-orange-500/30">
              <Cake className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Birthday Celebrations
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF6F00]/15 text-[#FF7A00]">
                  {totalCount} This Month
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kids and Volunteers celebrating birthdays in NXTGEN Roxas
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

        {/* Today's Birthdays Highlight Banner */}
        {todayBirthdays.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-pink-500/10 to-cyan-500/15 border-2 border-[#FF6F00] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#ea580c] dark:text-[#FF7A00]">
                <PartyPopper className="w-4 h-4" />
                Celebrating Today! 🎉
              </div>
              <button
                type="button"
                onClick={triggerBirthdayConfetti}
                className="text-[11px] font-bold text-[#0284c7] dark:text-[#29C5E8] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Celebrate with Confetti
              </button>
            </div>

            <div className="space-y-2">
              {todayBirthdays.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-orange-200 dark:border-orange-500/40 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-[#FF6F00] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                        {item.name}
                        {item.type === 'kid' ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-[#0284c7] dark:text-cyan-300 font-bold">
                            Kid
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 font-bold">
                            Volunteer
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {item.roleOrLevel} • {item.parentOrContact}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs text-[#FF6F00] bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-500/30 block">
                      {item.turningAge ? `Turning ${item.turningAge}` : 'Today!'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming This Week */}
        {upcomingThisWeek.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#29C5E8]" />
              Upcoming This Week ({upcomingThisWeek.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {upcomingThisWeek.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.roleOrLevel}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-[#0284c7] dark:text-[#29C5E8]">
                      {item.formattedDate}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      in {item.daysUntil} {item.daysUntil === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Later This Month */}
        {thisMonthBirthdays.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Later This Month ({thisMonthBirthdays.length})
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {thisMonthBirthdays.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.name} ({item.roleOrLevel})
                  </span>
                  <span className="font-mono text-slate-500 font-bold text-[11px]">
                    {item.formattedDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

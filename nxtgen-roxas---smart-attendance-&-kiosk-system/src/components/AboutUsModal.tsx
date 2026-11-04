import React, { useRef } from 'react';
import {
  X,
  Heart,
  Target,
  Sparkles,
  ShieldCheck,
  Compass,
  Award,
  Church,
  BookOpen,
  Users,
} from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-6 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white p-1 border-2 border-[#FF6F00] shadow-sm flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                alt="NXTGEN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white flex items-center">
                  <span className="text-[#0284c7] dark:text-[#29C5E8]">NXT</span>
                  <span className="text-[#FF6F00]">GEN</span>
                  <span className="ml-1.5 text-slate-900 dark:text-white">Roxas</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FF6F00]/15 text-[#FF6F00] border border-[#FF6F00]/30 uppercase">
                  About Us
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Children's Ministry of Christ's Commission Fellowship (CCF) • Roxas City
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Jump Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Jump to:
          </span>
          <button
            onClick={() => scrollToSection('section-overview')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-cyan-500/15 text-[#0284c7] dark:text-[#29C5E8] hover:bg-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('section-mission-vision')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-orange-500/15 text-[#FF6F00] hover:bg-orange-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Mission & Vision
          </button>
          <button
            onClick={() => scrollToSection('section-core-values')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Core Values (L.O.V.E.)
          </button>
          <button
            onClick={() => scrollToSection('section-safety')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Safety (S.A.F.E. & C.A.R.E.)
          </button>
          <button
            onClick={() => scrollToSection('section-categories')}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Lifeshaper Roles
          </button>
        </div>

        {/* Unified Document Content (All Sections Combined in One Scrollable Container) */}
        <div ref={contentRef} className="flex-1 overflow-y-auto space-y-8 pr-1.5">
          {/* 1. OVERVIEW & CALLING */}
          <section id="section-overview" className="space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/15 via-white to-orange-500/10 dark:from-cyan-950/40 dark:via-slate-900 dark:to-orange-950/20 border-2 border-[#29C5E8]/40 space-y-3">
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase flex flex-wrap items-center gap-1.5">
                <span className="text-[#0284c7] dark:text-[#29C5E8]">Nurturing Christlikeness</span>
                <span className="text-[#FF6F00]">In The Next Generation</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                <strong>NXTGEN</strong> is the children’s ministry of <strong>Christ’s Commission Fellowship (CCF)</strong>, dedicated to helping children know, love, and follow Jesus.
              </p>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                The name <strong>NXTGEN</strong> stands for <em>Nurturing Christlikeness in the Next Generation</em>. It’s more than our name — it’s our God-given mission.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>The Lifeshaper Calling</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                As a Lifeshaper, you’re part of that mission. Every lesson you teach, every prayer you pray, every game you lead, every check-in you assist, and every conversation you have is an opportunity to point a child to Jesus.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Together, we are raising the next generation of Christ-committed followers who will influence their families, communities, and the world for God’s glory.
              </p>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FF6F00]/15 to-[#29C5E8]/15 border border-[#FF6F00]/30 text-center font-black text-xs sm:text-sm text-[#ea580c] dark:text-[#FF7A00] uppercase tracking-wide">
                Every Sunday is more than a kids church service. It is an opportunity to shape lives for eternity.
              </div>
            </div>
          </section>

          {/* 2. MISSION & VISION */}
          <section id="section-mission-vision" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6F00]">
                You are helping write the faith story of the next generation
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-[#FF6F00]" />
                <span>Mission & Vision</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mission */}
              <div className="p-5 rounded-3xl bg-cyan-50/80 dark:bg-cyan-950/30 border-2 border-[#29C5E8]/50 space-y-2.5">
                <div className="flex items-center gap-2 text-[#0284c7] dark:text-[#29C5E8] font-black text-sm uppercase tracking-wider">
                  <Target className="w-5 h-5" />
                  Our Mission
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  To <strong>come alongside families in their journey of discipleship</strong> by discovering, developing, and deploying young Christ-committed followers who will make Christ-committed followers.
                </p>
              </div>

              {/* Vision */}
              <div className="p-5 rounded-3xl bg-orange-50/80 dark:bg-orange-950/30 border-2 border-[#FF6F00]/50 space-y-2.5">
                <div className="flex items-center gap-2 text-[#ea580c] dark:text-[#FF6F00] font-black text-sm uppercase tracking-wider">
                  <Compass className="w-5 h-5" />
                  Our Vision
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  To see the <strong>next generation of committed followers of the Lord Jesus Christ</strong> meeting in <strong>small groups</strong> and influencing lives, families, communities, and nations for the glory of God.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-black text-xs sm:text-sm text-[#0284c7] dark:text-[#29C5E8] uppercase tracking-wide">
              Mission becomes real when Lifeshapers like you live it out.
            </div>
          </section>

          {/* 3. CORE VALUES (L.O.V.E.) */}
          <section id="section-core-values" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6F00]">
                Children will remember what you teach and how you made them feel
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                Core Values: <span className="text-[#29C5E8]">L</span>.<span className="text-[#FF6F00]">O</span>.<span className="text-[#29C5E8]">V</span>.<span className="text-[#FF6F00]">E</span>.
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {/* L */}
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-800/60 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#29C5E8] text-slate-950 font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  L
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase">
                    Love God, Love Others
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Putting God first in all things and demonstrating genuine, unconditional Christlike care for every child and family.
                  </p>
                </div>
              </div>

              {/* O */}
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800/60 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF6F00] text-white font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  O
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase">
                    Obey God's Word & Authorities
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Living out biblical truth with integrity and respecting parents, leaders, teachers, and church authorities.
                  </p>
                </div>
              </div>

              {/* V */}
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-800/60 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#29C5E8] text-slate-950 font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  V
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase">
                    Volunteer
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Joyfully offering time, energy, and spiritual gifts to serve God and nurture the next generation with enthusiasm.
                  </p>
                </div>
              </div>

              {/* E */}
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800/60 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF6F00] text-white font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  E
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase">
                    Engage the Families
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Partnering intentionally with parents, encouraging home discipleship, and building strong family connections.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. SAFETY GUIDELINES (S.A.F.E. & C.A.R.E.) */}
          <section id="section-safety" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="p-4 rounded-3xl bg-cyan-50 dark:bg-cyan-950/30 border-2 border-[#29C5E8] text-center space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#29C5E8]" />
                <span>Every Child Deserves to Feel Safe</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                While we pray that children never experience abuse, bullying, or harm, we teach every child to remember <strong>S.A.F.E.</strong>, and every Lifeshaper to respond with <strong>C.A.R.E.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* S.A.F.E. FOR KIDS */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-cyan-400 dark:border-cyan-700/60 space-y-3">
                <div className="px-3 py-1 rounded-full bg-[#FF6F00] text-white font-black text-[11px] uppercase tracking-wider text-center">
                  What to Teach Kids to Do (S.A.F.E.)
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#29C5E8] text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      S
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Say 'No' & Step Away</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Say "No" or "Stop." Then move away from any person or place — especially if someone touches you in a way that feels wrong.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#FF6F00] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      A
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Ask for Help</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Tell a trusted adult right away — like your teacher, parents, or church leader. You can tell them what you saw, heard, or what happened.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#29C5E8] text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      F
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Follow Instructions</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Listen carefully and follow the instructions of trusted leaders so you can stay safe.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#FF6F00] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      E
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Exit into a Safe Place</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Go with your trusted adult to a safe space where you feel calm and protected.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* C.A.R.E. FOR LIFESHAPERS */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-[#FF6F00] space-y-3">
                <div className="px-3 py-1 rounded-full bg-[#29C5E8] text-slate-950 font-black text-[11px] uppercase tracking-wider text-center">
                  What to Do When a Child Confides (C.A.R.E.)
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#FF6F00] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      C
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Create a Safe Environment</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Make the child feel secure and respected. Choose a calm, private setting where they feel heard.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#29C5E8] text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      A
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Ask Gentle Questions & Ensure Understanding</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Use gentle, open-ended questions to clarify details. Avoid leading questions, and validate what you’ve heard.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#FF6F00] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      R
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Respond with Empathy & Sensitivity</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Acknowledge their feelings. Say "I’m glad you told me." Show genuine care in words, tone, and body language.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-[#29C5E8] text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      E
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white uppercase block">Encourage & Support</strong>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Assure them they did the right thing by speaking up. Let them know they are not alone, and guide them toward next steps.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. LIFESHAPER CATEGORIES */}
          <section id="section-categories" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6F00]">
                Serving together in Christ's kingdom
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-[#29C5E8]" />
                <span>Lifeshaper Categories</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adult Lifeshaper */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border-2 border-[#FF6F00] shadow-sm space-y-2.5">
                <div className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-[#FF6F00]/15 text-[#FF6F00] border border-[#FF6F00]/30 uppercase">
                  Lifeshaper
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Adult Volunteer (18 Years Old & Above)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Mentored to lead kids and fellow Lifeshapers, with the potential to guide and mentor Junior Lifeshapers across all Sunday classrooms.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <li>• Classroom Lead & Co-Lead Teaching</li>
                  <li>• Sunday Session Management & Parent Coordination</li>
                  <li>• Discipleship Mentorship for Junior Lifeshapers</li>
                </ul>
              </div>

              {/* Junior Lifeshaper */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border-2 border-[#29C5E8] shadow-sm space-y-2.5">
                <div className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-cyan-500/15 text-[#29C5E8] border border-cyan-500/30 uppercase">
                  Junior Lifeshaper
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  NXTGEN Graduate (13–17 Years Old)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Trained to become future leaders, developing skills in leadership, teamwork, and spiritual growth to prepare them for more significant ministry roles.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <li>• Praise & Worship Action Lead & Vocals</li>
                  <li>• Classroom Assistant & Activity Support</li>
                  <li>• Kiosk Welcome & Check-In Assistance</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <Church className="w-4 h-4 text-[#FF6F00]" />
            CCF NXTGEN Kids Church • Roxas City
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

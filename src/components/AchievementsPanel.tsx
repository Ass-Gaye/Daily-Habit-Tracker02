import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Sunrise, BookOpen, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { Achievement, UserProfile } from '../types';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: "perfect_monday",
    title: "Perfect Monday",
    description: "Launch your week with momentum! Complete all active habits on Monday.",
    iconName: "Flame",
    color: "from-purple-500 to-indigo-400"
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Punctuality champion! Check off 'Arrived on time' from Monday to Friday.",
    iconName: "Sunrise",
    color: "from-yellow-400 to-amber-500"
  },
  {
    id: "active_learner",
    title: "Active Learner",
    description: "Driven curiosity! Ask professional questions on 3 or more days of the week.",
    iconName: "BookOpen",
    color: "from-blue-500 to-indigo-400"
  },
  {
    id: "consistency_master",
    title: "Consistency Master",
    description: "Unwavering quality! Maintain an overall habit completion rate of 80% or more.",
    iconName: "Zap",
    color: "from-purple-500 to-indigo-400"
  },
  {
    id: "perfect_week",
    title: "One Week Champion",
    description: "Professional brilliance! Complete every single habit on every single work day of the week.",
    iconName: "Trophy",
    color: "from-amber-500 via-yellow-400 to-yellow-600"
  }
];

interface AchievementsPanelProps {
  userProfile: UserProfile;
  isDarkMode?: boolean;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ userProfile, isDarkMode = false }) => {
  const getIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-8 h-8 ${unlocked ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : 'text-slate-500 opacity-40'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Trophy':
      default:
        return <Trophy className={className} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between border-b pb-3 transition-colors ${
        isDarkMode ? 'border-slate-850' : 'border-indigo-100/60'
      }`}>
        <h4 className={`text-sm font-bold font-sans uppercase tracking-wide flex items-center gap-2 ${
          isDarkMode ? 'text-amber-400' : 'text-indigo-900'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          🏆 Career Badges & Achievements
        </h4>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
          isDarkMode ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-700 bg-indigo-100'
        }`}>
          {userProfile.achievements?.length || 0} / {ACHIEVEMENTS_LIST.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = userProfile.achievements?.includes(ach.id) || false;

          return (
            <motion.div
              key={ach.id}
              className={`relative overflow-hidden p-3 rounded-xl border flex gap-3.5 items-center transition-all ${
                isUnlocked
                  ? isDarkMode
                    ? 'bg-slate-900 border-slate-800 shadow-sm'
                    : 'bg-white border-indigo-100 shadow-sm'
                  : isDarkMode
                    ? 'opacity-40 bg-slate-950/40 border-dashed border-slate-800'
                    : 'opacity-50 bg-white/50 border-dashed border-slate-300'
              }`}
              whileHover={isUnlocked ? { y: -1 } : {}}
              transition={{ duration: 0.2 }}
            >
              {/* Badge Circular Emblem */}
              <div
                className={`p-2 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                  isUnlocked
                    ? isDarkMode
                      ? 'bg-amber-400/10 shadow-inner'
                      : 'bg-amber-100 shadow-sm'
                    : isDarkMode
                      ? 'bg-slate-900 border border-slate-850'
                      : 'bg-slate-100 border border-slate-200'
                }`}
              >
                {getIcon(ach.iconName, isUnlocked)}
              </div>

              {/* Text content */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className={`text-xs font-bold leading-tight ${isUnlocked ? (isDarkMode ? 'text-slate-100' : 'text-indigo-900') : 'text-slate-450'}`}>
                    {ach.title}
                  </h5>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                </div>
                <p className={`text-[11px] leading-snug font-sans ${isUnlocked ? (isDarkMode ? 'text-slate-300' : 'text-slate-600') : 'text-slate-450'}`}>
                  {ach.description}
                </p>
              </div>

              {/* Decorative side accent for unlocked badges */}
              {isUnlocked && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/5 transform rotate-45 translate-x-4 -translate-y-4" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

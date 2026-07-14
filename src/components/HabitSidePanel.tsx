import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Award, BookOpen, Briefcase, Calendar, MessageSquare } from 'lucide-react';
import { Habit, WeeklyProgress } from '../types';

interface HabitSidePanelProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  progress: WeeklyProgress;
  isDarkMode?: boolean;
}

export const HabitSidePanel: React.FC<HabitSidePanelProps> = ({
  habit,
  isOpen,
  onClose,
  progress,
  isDarkMode = false,
}) => {
  if (!habit) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Calculate this week's completion for this specific habit
  const completionStats = days.map(day => {
    const key = `${habit.id}_${day}`;
    const completed = !!progress.completions[key];
    const note = progress.notes[day];
    return { day, completed, note };
  });

  const completedCount = completionStats.filter(c => c.completed).length;
  const completionRate = Math.round((completedCount / 5) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={`fixed inset-0 z-50 transition-opacity ${
              isDarkMode ? 'bg-black/80 backdrop-blur-xs' : 'bg-black/60 backdrop-blur-xs'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer container */}
          <motion.div
            className={`fixed right-0 top-0 bottom-0 w-full max-w-md border-l shadow-2xl z-50 flex flex-col h-full transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className={`p-6 border-b flex items-center justify-between transition-colors ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isDarkMode 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-amber-600 bg-amber-50 border-amber-200/60'
                }`}>
                  {habit.category}
                </span>
                <h3 className={`text-xl font-bold font-sans mt-1 ${isDarkMode ? 'text-amber-400' : 'text-indigo-900'}`}>{habit.name}</h3>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  Description
                </h4>
                <p className={`text-sm leading-relaxed p-3.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-300' 
                    : 'bg-slate-50 border-slate-200/60 text-slate-600'
                }`}>
                  {habit.description || "Establish consistent performance in this professional duty."}
                </p>
              </div>

              {/* Why it matters */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Why It Matters
                </h4>
                <p className={`text-sm leading-relaxed p-3.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-300' 
                    : 'bg-slate-50 border-slate-200/60 text-slate-600'
                }`}>
                  {habit.whyItMatters || "Consistently practicing this habit sets you apart as a professional."}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  Professional Benefits
                </h4>
                <p className={`text-sm leading-relaxed p-3.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-300' 
                    : 'bg-slate-50 border-slate-200/60 text-slate-600'
                }`}>
                  {habit.benefits || "Accelerates project alignment, technical reputation, and overall trust."}
                </p>
              </div>

              {/* Progress Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  This Week's Completion
                </h4>
                <div className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
                  isDarkMode 
                    ? 'bg-amber-400/5 border-amber-500/20' 
                    : 'bg-indigo-50 border border-indigo-100/70'
                }`}>
                  <div>
                    <div className={`text-2xl font-bold font-sans ${isDarkMode ? 'text-amber-400' : 'text-indigo-900'}`}>{completedCount} <span className="text-sm text-slate-500 font-normal">/ 5 days</span></div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">Weekly Success Rate</div>
                  </div>
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-sm transition-colors ${
                    isDarkMode ? 'border-amber-400/30 bg-slate-950 text-amber-400' : 'border-indigo-200 bg-white text-indigo-700'
                  }`}>
                    {completionRate}%
                  </div>
                </div>
              </div>

              {/* Detailed Completion Days */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase font-bold">
                  Daily Log Detail
                </h4>
                <div className="space-y-2">
                  {completionStats.map(({ day, completed, note }) => (
                    <div 
                      key={day}
                      className={`flex flex-col p-3 rounded-lg border transition-colors ${
                        completed 
                          ? isDarkMode 
                            ? 'bg-amber-400/5 border-amber-500/20' 
                            : 'bg-indigo-50/50 border-indigo-100' 
                          : isDarkMode 
                            ? 'bg-slate-950 border-slate-850' 
                            : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{day}</span>
                        {completed ? (
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-450">Not Completed</span>
                        )}
                      </div>
                      
                      {note && (
                        <div className={`mt-2 text-xs p-2 rounded border flex items-start gap-1.5 leading-relaxed transition-colors ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-800 text-slate-300' 
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          <MessageSquare className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t text-center transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100'
            }`}>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-extrabold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                Back to Tracker
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

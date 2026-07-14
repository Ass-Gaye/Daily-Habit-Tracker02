import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Edit2, Play, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { DailyReminder } from '../types';
import { PRESET_REMINDERS } from '../lib/habitDefaults';

interface RemindersPanelProps {
  onNotifyTest: (message: string) => void;
  isDarkMode?: boolean;
}

export const RemindersPanel: React.FC<RemindersPanelProps> = ({ onNotifyTest, isDarkMode = false }) => {
  const [reminders, setReminders] = useState<DailyReminder[]>(() => {
    const saved = localStorage.getItem('habit_reminders');
    return saved ? JSON.parse(saved) : PRESET_REMINDERS;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const saveReminders = (updated: DailyReminder[]) => {
    setReminders(updated);
    localStorage.setItem('habit_reminders', JSON.stringify(updated));
  };

  const handleToggle = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveReminders(updated);
  };

  const handleStartEdit = (reminder: DailyReminder) => {
    setEditingId(reminder.id);
    setEditTime(reminder.time);
    setEditMessage(reminder.message);
  };

  const handleSaveEdit = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id 
        ? { ...r, time: editTime, message: editMessage } 
        : r
    );
    saveReminders(updated);
    setEditingId(null);
  };

  const handleTriggerTest = (reminder: DailyReminder) => {
    onNotifyTest(reminder.message);
  };

  return (
    <div className={`space-y-4 p-5 rounded-2xl border transition-colors ${
      isDarkMode ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className={`flex items-center justify-between border-b pb-3 transition-colors ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <h4 className={`text-sm font-bold font-sans flex items-center gap-2 ${
            isDarkMode ? 'text-amber-400' : 'text-indigo-900'
          }`}>
            <Bell className="w-4 h-4 text-amber-500" />
            Habit Reminders System
          </h4>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stay accountable with custom workday checkpoints</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          isDarkMode ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-700 bg-indigo-50'
        }`}>
          Active Alerts
        </span>
      </div>

      <div className="space-y-3">
        {reminders.map((rem) => {
          const isEditing = editingId === rem.id;

          return (
            <div 
              key={rem.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                rem.enabled 
                  ? isDarkMode
                    ? 'bg-amber-500/5 border-amber-550/20'
                    : 'bg-indigo-50/45 border-indigo-100' 
                  : isDarkMode
                    ? 'bg-slate-950 border-slate-800 opacity-60'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <input 
                      type="time" 
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className={`md:col-span-3 border rounded px-2 py-1 text-sm font-mono focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    <input 
                      type="text" 
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className={`md:col-span-9 border rounded px-3 py-1 text-sm focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md shrink-0 ${
                      isDarkMode ? 'text-amber-400 bg-amber-550/10' : 'text-indigo-700 bg-indigo-100/80'
                    }`}>
                      {rem.time}
                    </span>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>{rem.message}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3.5 shrink-0">
                {isEditing ? (
                  <button
                    onClick={() => handleSaveEdit(rem.id)}
                    className="p-1.5 bg-amber-500 hover:bg-amber-600 text-indigo-950 rounded font-extrabold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(rem)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                      }`}
                      title="Edit reminder"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTriggerTest(rem)}
                      className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-mono font-bold cursor-pointer ${
                        isDarkMode ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title="Test Alert Popup"
                    >
                      <Play className="w-3.5 h-3.5" /> Test
                    </button>
                  </>
                )}

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(rem.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    rem.enabled 
                      ? isDarkMode ? 'bg-amber-400' : 'bg-amber-500' 
                      : isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                  aria-label="Toggle reminder"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      rem.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

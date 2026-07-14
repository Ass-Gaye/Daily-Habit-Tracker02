import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit2, Trash2, Users, Settings, Briefcase, HelpCircle, Save, Info } from 'lucide-react';
import { Habit, UserProfile } from '../types';
import { saveHabit, deleteHabit } from '../lib/habitService';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onRefreshHabits: () => void;
  currentUser: UserProfile;
  isDarkMode?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  habits,
  onRefreshHabits,
  currentUser,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'habits' | 'users'>('habits');
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Professionalism');
  const [formDescription, setFormDescription] = useState('');
  const [formWhyItMatters, setFormWhyItMatters] = useState('');
  const [formBenefits, setFormBenefits] = useState('');

  // Fetch all users when user tab is active
  useEffect(() => {
    if (activeTab === 'users' && isOpen) {
      fetchUsers();
    }
  }, [activeTab, isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUserList(users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUserList(prev => prev.map(u => u.uid === currentUser.uid ? { ...u, ...currentUser } : u));
      setLoadingUsers(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormId('');
    setFormName('');
    setFormCategory('Professionalism');
    setFormDescription('');
    setFormWhyItMatters('');
    setFormBenefits('');
    setErrorMessage('');
  };

  const handleEditClick = (habit: Habit) => {
    setIsEditing(true);
    setFormId(habit.id);
    setFormName(habit.name);
    setFormCategory(habit.category);
    setFormDescription(habit.description || '');
    setFormWhyItMatters(habit.whyItMatters || '');
    setFormBenefits(habit.benefits || '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory.trim()) {
      setErrorMessage('Name and Category are required.');
      return;
    }

    const id = isEditing ? formId : formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    if (!id) {
      setErrorMessage('Invalid habit ID generated. Choose a different name.');
      return;
    }

    // Check duplicate ID for new habits
    if (!isEditing && habits.some(h => h.id === id)) {
      setErrorMessage('A habit with this name or ID already exists.');
      return;
    }

    const newHabit: Habit = {
      id,
      name: formName.trim(),
      category: formCategory,
      description: formDescription.trim(),
      whyItMatters: formWhyItMatters.trim(),
      benefits: formBenefits.trim(),
      createdBy: currentUser.uid,
      createdAt: isEditing 
        ? (habits.find(h => h.id === formId)?.createdAt || new Date().toISOString())
        : new Date().toISOString()
    };

    try {
      await saveHabit(newHabit);
      setSuccessMessage(isEditing ? 'Habit updated successfully!' : 'Habit created successfully!');
      resetForm();
      onRefreshHabits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Failed to save habit. Check your permissions.');
    }
  };

  const handleDeleteClick = async (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit? All progress logs for this habit will be detached.')) {
      try {
        await deleteHabit(habitId);
        setSuccessMessage('Habit deleted successfully!');
        onRefreshHabits();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrorMessage('Failed to delete habit.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={`absolute inset-0 transition-colors ${
        isDarkMode ? 'bg-slate-950/70 backdrop-blur-xs' : 'bg-slate-900/40 backdrop-blur-xs'
      }`} onClick={onClose} />

      {/* Modal Card */}
      <motion.div
        className={`relative border rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg animate-pulse ${
              isDarkMode ? 'bg-amber-400/10 text-amber-400' : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xl font-bold font-sans ${isDarkMode ? 'text-amber-400' : 'text-indigo-900'}`}>Admin Workspace</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customize tracking schemas and inspect user activity metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-850' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className={`flex border-b transition-colors px-6 ${
          isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={() => setActiveTab('habits')}
            className={`py-3 px-4 font-sans text-xs tracking-wider uppercase border-b-2 font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'habits' 
                ? 'border-amber-500 text-amber-500' 
                : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-slate-200'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Manage Habits ({habits.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 font-sans text-xs tracking-wider uppercase border-b-2 font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'border-amber-500 text-amber-500' 
                : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-slate-200'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <Users className="w-4 h-4" />
            User Statistics
          </button>
        </div>

        {/* Content Container */}
        <div className={`flex-1 overflow-y-auto p-6 transition-colors ${
          isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
        }`}>
          {successMessage && (
            <div className={`mb-4 p-3 border rounded-lg text-sm flex items-center gap-2 font-medium transition-colors ${
              isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className={`mb-4 p-3 border rounded-lg text-sm flex items-center gap-2 font-medium transition-colors ${
              isDarkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {activeTab === 'habits' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              {/* Left Column: Form */}
              <div className={`lg:col-span-5 p-5 rounded-xl border flex flex-col justify-between transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-850 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <h4 className={`text-sm font-bold font-sans uppercase tracking-wide flex items-center gap-2 ${
                    isDarkMode ? 'text-amber-400' : 'text-indigo-900'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    {isEditing ? '✏️ Edit Habit' : '➕ Create New Habit'}
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Habit Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., Prepared questions"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
                      }`}
                    >
                      <option value="Professionalism" className={isDarkMode ? 'bg-slate-900 text-slate-100' : ''}>Professionalism</option>
                      <option value="Productivity" className={isDarkMode ? 'bg-slate-900 text-slate-100' : ''}>Productivity</option>
                      <option value="Growth" className={isDarkMode ? 'bg-slate-900 text-slate-100' : ''}>Growth</option>
                      <option value="Communication" className={isDarkMode ? 'bg-slate-900 text-slate-100' : ''}>Communication</option>
                      <option value="Culture" className={isDarkMode ? 'bg-slate-900 text-slate-100' : ''}>Culture</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Description (Optional)</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Be seated and prepared 10 mins early..."
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm h-16 focus:outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Why It Matters (Optional)</label>
                    <textarea
                      value={formWhyItMatters}
                      onChange={(e) => setFormWhyItMatters(e.target.value)}
                      placeholder="Punctuality reflects personal integrity..."
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm h-16 focus:outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Professional Benefits (Optional)</label>
                    <textarea
                      value={formBenefits}
                      onChange={(e) => setFormBenefits(e.target.value)}
                      placeholder="Demonstrates early leadership qualities..."
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm h-16 focus:outline-none transition-colors resize-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-extrabold py-2 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save Habit
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className={`py-2 px-3 rounded-lg text-sm transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column: Habit list */}
              <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
                <h4 className={`text-sm font-bold font-sans mb-3 flex items-center gap-1.5 ${
                  isDarkMode ? 'text-amber-400' : 'text-indigo-900'
                }`}>
                  Current Tracker Habits
                </h4>
                <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[380px] pr-1">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3.5 border shadow-xs rounded-xl transition-all ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-800 hover:border-amber-500/30' 
                          : 'bg-white border-slate-200 hover:border-indigo-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-850'}`}>{habit.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isDarkMode 
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                              : 'text-amber-600 bg-amber-50 border-amber-200/50'
                          }`}>
                            {habit.category}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 truncate max-w-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {habit.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditClick(habit)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(habit.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isDarkMode ? 'text-rose-400 hover:text-rose-350 hover:bg-slate-800' : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Delete"
                          disabled={habits.length <= 1} // Ensure they don't delete everything
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* User Statistics list */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-bold font-sans ${isDarkMode ? 'text-amber-400' : 'text-indigo-900'}`}>
                  Registered Workplace Trackers ({userList.length})
                </h4>
                <button
                  onClick={fetchUsers}
                  className={`text-xs font-bold cursor-pointer ${isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                  disabled={loadingUsers}
                >
                  {loadingUsers ? 'Refreshing...' : '🔄 Refresh Data'}
                </button>
              </div>

              {loadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className={`h-16 animate-pulse rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {userList.map((user) => (
                    <div
                      key={user.uid}
                      className={`p-4 border shadow-xs rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {user.displayName || 'Anonymous'}
                          </span>
                          {user.isAdmin && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                              isDarkMode ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-900 bg-indigo-100'
                            }`}>
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate max-w-xs">
                          {user.email || 'Anonymous Sign-In'}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs font-mono">
                        <div className="text-center">
                          <div className="text-amber-500 font-bold text-sm">🔥 {user.currentStreak}d</div>
                          <div className="text-slate-400 text-[10px]">Streak</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>🏆 {user.longestStreak}d</div>
                          <div className="text-slate-400 text-[10px]">Longest</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>🎯 {user.weeklyGoal}</div>
                          <div className="text-slate-400 text-[10px]">Goal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-amber-500 font-bold text-sm">🏅 {user.achievements?.length || 0}</div>
                          <div className="text-slate-400 text-[10px]">Badges</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t text-right transition-colors ${
          isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-indigo-900 hover:bg-indigo-800 active:bg-indigo-950 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
          >
            Close Workplace Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};

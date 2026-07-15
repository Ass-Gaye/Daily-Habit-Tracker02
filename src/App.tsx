import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  Trophy, 
  Flame, 
  Sunrise, 
  BookOpen, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Settings, 
  User, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Save, 
  Bell, 
  LogOut, 
  Sparkles, 
  Info, 
  X, 
  FileText,
  Activity,
  Award,
  BookMarked,
  Sun,
  Moon,
  Download,
  Smartphone,
  Monitor
} from 'lucide-react';

import { auth, db } from './lib/firebase';
import { Habit, UserProfile, WeeklyProgress } from './types';
import { 
  getHabits, 
  getUserProfile, 
  updateUserProfile, 
  getWeeklyProgress, 
  saveWeeklyProgress 
} from './lib/habitService';
import { 
  getMondayOfCurrentWeek, 
  getWorkWeekDays, 
  getWeekRangeLabel, 
  getShortDayLabel 
} from './lib/dateUtils';
import { MOTIVATIONAL_QUOTES } from './lib/habitDefaults';

// Import our modular components
import { CircularProgress } from './components/CircularProgress';
import { HabitSidePanel } from './components/HabitSidePanel';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AdminPanel } from './components/AdminPanel';
import { AchievementsPanel, ACHIEVEMENTS_LIST } from './components/AchievementsPanel';
import { RemindersPanel } from './components/RemindersPanel';

export default function App() {
  // Auth & Profile State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Weekly Habit State
  const [selectedMonday, setSelectedMonday] = useState<Date>(() => getMondayOfCurrentWeek());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  // Selected Habit for Side Panel
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Active UI Controls
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activeNoteDay, setActiveNoteDay] = useState<string>('Monday');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [simulatedAdmin, setSimulatedAdmin] = useState(false);

  // Reminders Notification popup state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // New Achievement Earned notification state
  const [newAchievement, setNewAchievement] = useState<string | null>(null);

  // Google Login Iframe/Popup helper modal
  const [showLoginHelp, setShowLoginHelp] = useState(false);

  // Progressive Web App (PWA) Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Dark Mode Toggle
  const handleToggleDarkMode = async () => {
    if (!profile) return;
    const nextMode = !profile.darkMode;
    const updatedProfile = { ...profile, darkMode: nextMode };
    setProfile(updatedProfile);
    try {
      await updateUserProfile(profile.uid, { darkMode: nextMode });
      showToastMessage(nextMode ? "🌙 Dark mode enabled and saved to your profile" : "☀️ Light mode enabled and saved to your profile");
    } catch (err) {
      console.error("Failed to update dark mode setting:", err);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekDays = getWorkWeekDays(selectedMonday);
  const weekId = weekDays[0].dateStr; // The Monday's formatted YYYY-MM-DD acts as week ID

  // Debouncing for auto-saving notes
  const saveNoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive Web App (PWA) Environment Detection & Event Registration
  useEffect(() => {
    setIsIframe(window.self !== window.top);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsPwaInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPwaInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setIsPwaInstallable(false);
      setDeferredPrompt(null);
      showToastMessage("🎉 Awesome! Weekly Habit Tracker has been installed as a native Web App.");
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToastMessage("🚀 Thank you for installing our Web App!");
    }
    setDeferredPrompt(null);
    setIsPwaInstallable(false);
  };

  // 1. Initial Authentication & Auto Anonymous Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const userProfile = await getUserProfile(
            user.uid, 
            user.email || undefined, 
            user.displayName || undefined
          );
          setProfile(userProfile);
          
          // If the user's email is the bootstrapped admin email, grant admin immediately
          if (user.email === 'dewsangam1@gmail.com') {
            setSimulatedAdmin(true);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        // No user signed in, trigger frictionless anonymous login
        console.log("Triggering anonymous login...");
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Failed to sign in anonymously (using offline fallback):", err);
          // Fall back to offline/local guest profile
          try {
            const guestProfile = await getUserProfile('guest_local_user', 'guest@local.dev', 'Guest Intern (Offline)');
            setProfile(guestProfile);
            setFirebaseUser({
              uid: 'guest_local_user',
              isAnonymous: true,
              displayName: 'Guest Intern (Offline)',
              email: 'guest@local.dev'
            } as any);
          } catch (localErr) {
            console.warn("Failed to initialize guest profile:", localErr);
          }
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Habits & Current Week Progress
  const fetchHabitsAndProgress = async () => {
    if (!profile) return;
    setLoadingProgress(true);
    try {
      // Get all active habits (seeds defaults if database is empty!)
      const allHabits = await getHabits();
      setHabits(allHabits);

      // Get progress for the selected week
      const progress = await getWeeklyProgress(profile.uid, weekId);
      setWeeklyProgress(progress);
      
      // Load note content for the currently active day
      setNoteContent(progress.notes[activeNoteDay] || '');
    } catch (err) {
      console.error("Error loading habits or progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    fetchHabitsAndProgress();
  }, [profile?.uid, weekId]);

  // Load note content when active note day changes
  useEffect(() => {
    if (weeklyProgress) {
      setNoteContent(weeklyProgress.notes[activeNoteDay] || '');
    }
  }, [activeNoteDay, weeklyProgress]);

  // 3. Auto-save Notes Handler with Debounce
  const handleNoteChange = (text: string) => {
    setNoteContent(text);
    setIsSavingNote(true);

    if (saveNoteTimeoutRef.current) {
      clearTimeout(saveNoteTimeoutRef.current);
    }

    saveNoteTimeoutRef.current = setTimeout(async () => {
      if (!profile || !weeklyProgress) return;
      
      const updatedProgress: WeeklyProgress = {
        ...weeklyProgress,
        notes: {
          ...weeklyProgress.notes,
          [activeNoteDay]: text,
        },
        updatedAt: new Date().toISOString()
      };

      try {
        await saveWeeklyProgress(profile.uid, updatedProgress);
        setWeeklyProgress(updatedProgress);
      } catch (err) {
        console.error("Failed to auto-save notes:", err);
      } finally {
        setIsSavingNote(false);
      }
    }, 1000);
  };

  // Ensure any pending notes save when switching days or weeks
  useEffect(() => {
    return () => {
      if (saveNoteTimeoutRef.current) {
        clearTimeout(saveNoteTimeoutRef.current);
      }
    };
  }, []);

  // 4. Toggle a Habit Checkbox (Save Instantly)
  const handleToggleHabit = async (habitId: string, day: string) => {
    if (!profile || !weeklyProgress) return;

    const key = `${habitId}_${day}`;
    const wasCompleted = !!weeklyProgress.completions[key];
    
    const updatedCompletions = {
      ...weeklyProgress.completions,
      [key]: !wasCompleted,
    };

    const updatedProgress: WeeklyProgress = {
      ...weeklyProgress,
      completions: updatedCompletions,
      updatedAt: new Date().toISOString()
    };

    // Update state locally first for snappy UI
    setWeeklyProgress(updatedProgress);

    try {
      await saveWeeklyProgress(profile.uid, updatedProgress);
      
      // Re-evaluate achievements and streaks after saving progress
      await evaluateStreaksAndAchievements(updatedProgress);
    } catch (err) {
      console.error("Failed to save checkbox change:", err);
      // Revert if write failed
      fetchHabitsAndProgress();
    }
  };

  // 5. Streaks and Achievements Evaluator (Rule Engine)
  const evaluateStreaksAndAchievements = async (prog: WeeklyProgress) => {
    if (!profile) return;

    let achievementsEarned = [...(profile.achievements || [])];
    const newEarnedThisTurn: string[] = [];

    // Helper: Count total habits
    const totalHabitsCount = habits.length;
    if (totalHabitsCount === 0) return;

    // --- RULE 1: Perfect Monday ---
    const completionsMonday = habits.filter(h => !!prog.completions[`${h.id}_Monday`]).length;
    const isPerfectMonday = completionsMonday === totalHabitsCount;
    if (isPerfectMonday && !achievementsEarned.includes('perfect_monday')) {
      achievementsEarned.push('perfect_monday');
      newEarnedThisTurn.push('Perfect Monday');
    }

    // --- RULE 2: Early Bird (Arrived on time all 5 days) ---
    const arrivedOnTimeCount = daysOfWeek.filter(day => !!prog.completions[`arrived_on_time_${day}`]).length;
    if (arrivedOnTimeCount === 5 && !achievementsEarned.includes('early_bird')) {
      achievementsEarned.push('early_bird');
      newEarnedThisTurn.push('Early Bird');
    }

    // --- RULE 3: Active Learner (Asked question >= 3 days) ---
    const askedQuestionCount = daysOfWeek.filter(day => !!prog.completions[`asked_a_question_${day}`]).length;
    if (askedQuestionCount >= 3 && !achievementsEarned.includes('active_learner')) {
      achievementsEarned.push('active_learner');
      newEarnedThisTurn.push('Active Learner');
    }

    // --- RULE 4: Consistency Master (Overall completed rate >= 80% this week) ---
    const totalPossibleChecks = totalHabitsCount * 5;
    const currentCompletedChecks = Object.values(prog.completions).filter(Boolean).length;
    const overallRate = totalPossibleChecks > 0 ? (currentCompletedChecks / totalPossibleChecks) * 100 : 0;
    
    if (overallRate >= 80 && !achievementsEarned.includes('consistency_master')) {
      achievementsEarned.push('consistency_master');
      newEarnedThisTurn.push('Consistency Master');
    }

    // --- RULE 5: One Week Champion (Perfect Week, all checked) ---
    const isPerfectWeek = currentCompletedChecks === totalPossibleChecks;
    if (isPerfectWeek && !achievementsEarned.includes('perfect_week')) {
      achievementsEarned.push('perfect_week');
      newEarnedThisTurn.push('One Week Champion');
    }

    // --- STREAK SYSTEM CALCULATION ---
    // A streak day is a day where ALL active habits are completed.
    // Let's analyze Monday to Friday completions.
    let streakDaysCount = 0;
    let maxStreakThisWeek = 0;
    
    daysOfWeek.forEach(day => {
      const dayCompletions = habits.filter(h => !!prog.completions[`${h.id}_${day}`]).length;
      if (dayCompletions === totalHabitsCount) {
        streakDaysCount++;
        if (streakDaysCount > maxStreakThisWeek) {
          maxStreakThisWeek = streakDaysCount;
        }
      } else {
        // Only reset if they did some habits but missed some, or didn't complete all.
        // For streaks, we count consecutive perfect days.
        streakDaysCount = 0;
      }
    });

    // If there is consecutive completions, let's keep streak value.
    // If we have other weeks, we could combine, but let's base streak on current week performance and history.
    let updatedCurrentStreak = profile.currentStreak;
    // Simple sandbox rule: streak is the longest consecutive perfect days of current week
    updatedCurrentStreak = maxStreakThisWeek;
    
    const updatedLongestStreak = Math.max(profile.longestStreak, updatedCurrentStreak);

    // If new achievements earned, notify user with a beautiful animation
    if (newEarnedThisTurn.length > 0) {
      setNewAchievement(newEarnedThisTurn[newEarnedThisTurn.length - 1]);
      setTimeout(() => setNewAchievement(null), 5000);
    }

    // Write statistics update to Firestore user profile
    const updatedProfile: UserProfile = {
      ...profile,
      currentStreak: updatedCurrentStreak,
      longestStreak: updatedLongestStreak,
      achievements: achievementsEarned,
      lastActiveDate: new Date().toISOString().substring(0, 10)
    };

    setProfile(updatedProfile);
    await updateUserProfile(profile.uid, {
      currentStreak: updatedCurrentStreak,
      longestStreak: updatedLongestStreak,
      achievements: achievementsEarned,
      lastActiveDate: updatedProfile.lastActiveDate
    });
  };

  // 6. Navigation between Weeks
  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const nextMonday = new Date(selectedMonday);
    if (direction === 'prev') {
      nextMonday.setDate(selectedMonday.getDate() - 7);
    } else {
      nextMonday.setDate(selectedMonday.getDate() + 7);
    }
    setSelectedMonday(nextMonday);
  };

  const handleNavigateCurrentWeek = () => {
    setSelectedMonday(getMondayOfCurrentWeek());
  };

  // 7. Calculate overall stats for the view
  const totalHabits = habits.length;
  const maxWeeklyChecks = totalHabits * 5;
  const totalCheckedThisWeek = weeklyProgress 
    ? Object.values(weeklyProgress.completions).filter(Boolean).length 
    : 0;
  const overallPercentage = maxWeeklyChecks > 0 
    ? (totalCheckedThisWeek / maxWeeklyChecks) * 100 
    : 0;

  // Habits Remaining
  const habitsRemaining = maxWeeklyChecks - totalCheckedThisWeek;

  // Daily Completion Counts
  const dailyCompletions = daysOfWeek.map(day => {
    let checked = 0;
    habits.forEach(h => {
      const key = `${h.id}_${day}`;
      if (weeklyProgress?.completions[key]) {
        checked++;
      }
    });
    return { day, checked };
  });

  // Today's Date info for visual indicators
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = todayDayName === 'Saturday' || todayDayName === 'Sunday';

  // Google Login popup
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Link or create profile done automatically in the auth change hook
      showToastMessage(`👋 Welcomed back, ${result.user.displayName}! Your data is synced.`);
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      // Check for known iframe-based popup blocking, closure, or cancel codes
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-blocked' ||
        window.self !== window.top
      ) {
        setShowLoginHelp(true);
        showToastMessage("⚠️ Google Sign-In blocked/closed. Troubleshooting guide opened.");
      } else {
        showToastMessage(`⚠️ Google Sign-In failed: ${err?.message || "Please try again."}`);
      }
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToastMessage("🔒 Signed out. Logged back in anonymously.");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 selection:bg-amber-500 selection:text-indigo-900 font-sans transition-colors duration-300 ${
      profile?.darkMode 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Toast Alert Popups */}
      <AnimatePresence>
        {toastVisible && toastMessage && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50 bg-indigo-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm border border-amber-500/30 border-l-4 border-l-amber-500"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <Bell className="w-5 h-5 animate-bounce shrink-0 text-amber-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button 
              onClick={() => setToastVisible(false)}
              className="ml-auto text-indigo-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Unlocked Popup Banner */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div 
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-950 text-white px-6 py-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-4 max-w-md w-11/12"
            initial={{ y: -100, x: "-50%", scale: 0.9, opacity: 0 }}
            animate={{ y: 0, x: "-50%", scale: 1, opacity: 1 }}
            exit={{ y: -100, x: "-50%", scale: 0.9, opacity: 0 }}
          >
            <div className="p-3 bg-amber-500 rounded-full text-indigo-950 shadow-inner shrink-0">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-amber-500">Achievement Unlocked!</div>
              <h4 className="text-lg font-black tracking-tight text-white">{newAchievement}</h4>
              <p className="text-xs font-medium text-slate-300">Career credentials successfully written to your profile.</p>
            </div>
            <button 
              onClick={() => setNewAchievement(null)}
              className="ml-auto p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout Centered Dashboard Container */}
      <div className="max-w-7xl mx-auto space-y-6">        {/* Top Header Panel (Clean & Minimalist) */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-indigo-900 text-white p-6 rounded-2xl border-b-4 border-amber-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-amber-400">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
                Weekly Habit Tracker
                <span className="text-xs font-mono font-bold text-indigo-950 bg-amber-400 px-2.5 py-0.5 rounded tracking-wide uppercase">
                  v1.0 Professional
                </span>
              </h1>
              <p className="text-sm text-indigo-200">Track professional accountability, build outstanding routines</p>
            </div>
          </div>

          {/* User auth and controls */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {profile && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-indigo-300 font-mono">Signed in as</div>
                <div className="text-sm font-bold text-white truncate max-w-[180px]">
                  {firebaseUser?.isAnonymous ? 'Anonymous Intern' : profile.displayName || firebaseUser?.email}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {/* Login/Logout Button */}
              {firebaseUser && !firebaseUser.isAnonymous ? (
                <button
                  onClick={handleSignOut}
                  className="p-2 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 hover:text-white border border-indigo-750 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="p-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  title="Secure your account with Google"
                >
                  <User className="w-4 h-4" />
                  <span>Google Sync</span>
                </button>
              )}

              {/* Dark Mode Toggle Button */}
              <button
                onClick={handleToggleDarkMode}
                className="p-2 bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors text-xs flex items-center justify-center cursor-pointer"
                title={profile?.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {profile?.darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-300" />
                )}
              </button>

              {/* Simulated Admin Mode Toggle for easy Sandbox Review */}
              <button
                onClick={() => setSimulatedAdmin(!simulatedAdmin)}
                className={`p-2 border rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  simulatedAdmin 
                    ? 'bg-amber-500 text-indigo-950 border-amber-500 shadow-sm' 
                    : 'bg-white/10 border-white/20 text-indigo-200 hover:text-white hover:bg-white/20'
                }`}
                title="Reviewer Workspace Simulator"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>Admin Mode: {simulatedAdmin ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Motivational message banner */}
        <div className={`p-4 border rounded-xl text-center flex flex-col sm:flex-row items-center justify-center gap-2 transition-colors duration-300 ${
          profile?.darkMode 
            ? 'bg-slate-900 border-slate-800 text-slate-300' 
            : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-sans">
            Current Motivational Quote: 
            <strong className={`font-sans ml-1 italic font-semibold ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'}`}>
              "{MOTIVATIONAL_QUOTES[selectedMonday.getDate() % MOTIVATIONAL_QUOTES.length]}"
            </strong>
          </span>
        </div>

        {/* PWA / Native Web App Installer Prompt Banner */}
        <AnimatePresence>
          {!isPwaInstalled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-5 rounded-2xl border transition-all duration-300 shadow-sm ${
                profile?.darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200 text-slate-800 shadow-xs'
              }`}
            >
              {isIframe ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <Smartphone className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                        📱 Download Weekly Habit Tracker as an App
                      </h3>
                      <p className={`text-xs mt-0.5 ${profile?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        You are viewing inside a secure workspace iframe. Open the app in a new tab to add it directly to your home screen!
                      </p>
                    </div>
                  </div>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-bold font-sans rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Open & Install App
                  </a>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <Download className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                        ✨ Install Habit Tracker on your Device
                      </h3>
                      <p className={`text-xs mt-0.5 ${profile?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Enjoy offline routine writing, instant access, full screen layout, and robust automatic profile synchronization.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowInstallGuide(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        profile?.darkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Installation Guide
                    </button>
                    <button
                      onClick={handleInstallApp}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-bold font-sans rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Smartphone className="w-4 h-4" />
                      Install Now
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Grid: Layout is organized with key stats up top, core table below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Workspace Column (Left) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Week Navigation bar */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className={`w-5 h-5 ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'}`} />
                <span className={`text-sm font-extrabold font-sans ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {getWeekRangeLabel(selectedMonday)}
                </span>
                {weekId === getMondayOfCurrentWeek().toISOString().substring(0, 10) && (
                  <span className={`text-[10px] border font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                    profile?.darkMode 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    This Week
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between">
                <button
                  onClick={() => handleNavigateWeek('prev')}
                  className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                    profile?.darkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-600'
                  }`}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNavigateCurrentWeek}
                  className={`px-3 py-1 border rounded-lg text-xs font-sans font-bold uppercase cursor-pointer transition-colors ${
                    profile?.darkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-amber-400' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Current Week
                </button>
                <button
                  onClick={() => handleNavigateWeek('next')}
                  className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                    profile?.darkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-600'
                  }`}
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Core habit Table Card */}
            <div className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              
              {/* Header inside Card */}
              <div className={`p-5 border-b flex items-center justify-between flex-wrap gap-2 transition-colors ${
                profile?.darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-white'
              }`}>
                <div>
                  <h2 className={`text-lg font-bold font-sans ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'}`}>Workbook Habits Checklist</h2>
                  <p className={`text-xs ${profile?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Click on habit names to view details and professional values</p>
                </div>
                
                {simulatedAdmin && (
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="py-1.5 px-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-indigo-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Workspace Settings</span>
                  </button>
                )}
              </div>

              {/* Table Container - supports responsive horizontal scrolling */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className={`text-[11px] font-mono uppercase border-b transition-colors duration-300 ${
                      profile?.darkMode 
                        ? 'bg-slate-950 text-slate-400 border-slate-800' 
                        : 'bg-slate-50/80 text-slate-400 border-slate-200'
                    }`}>
                      <th className="p-4 pl-6 font-bold w-2/5">Daily Habit</th>
                      {weekDays.map((day) => {
                        const isToday = day.name === todayDayName && !isWeekend && weekId === getMondayOfCurrentWeek().toISOString().substring(0, 10);
                        return (
                          <th 
                            key={day.name} 
                            className={`p-4 text-center font-bold text-xs uppercase transition-colors duration-200 w-[12%] ${
                              isToday 
                                ? profile?.darkMode
                                  ? 'text-amber-400 border-x border-slate-800 bg-amber-500/5'
                                  : 'text-amber-600 border-x border-slate-100 bg-amber-50/20' 
                                : 'text-slate-400'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span>{day.name}</span>
                              <span className={`text-[9px] font-bold tracking-wider mt-0.5 ${
                                isToday 
                                  ? 'text-amber-500' 
                                  : profile?.darkMode ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                {getShortDayLabel(day.date)}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-300 ${
                    profile?.darkMode ? 'divide-slate-850' : 'divide-slate-100'
                  }`}>
                    {loadingProgress ? (
                      [1, 2, 3, 4, 5].map((idx) => (
                        <tr key={idx}>
                          <td className="p-4 pl-6">
                            <div className={`h-5 animate-pulse rounded w-3/4 ${profile?.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                          </td>
                          {daysOfWeek.map((day) => (
                            <td key={day} className="p-4">
                              <div className={`h-6 w-6 animate-pulse rounded mx-auto ${profile?.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : habits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                          No active habits found. Enable Admin Mode to create some!
                        </td>
                      </tr>
                    ) : (
                      habits.map((habit) => (
                        <tr key={habit.id} className={`transition-colors duration-300 ${
                          profile?.darkMode 
                            ? 'hover:bg-slate-950/40' 
                            : 'hover:bg-slate-50/50'
                        }`}>
                          <td className={`p-4 pl-6 border-b transition-colors duration-300 ${
                            profile?.darkMode ? 'border-slate-850' : 'border-slate-100'
                          }`}>
                            <button
                              onClick={() => {
                                setSelectedHabit(habit);
                                setIsSidePanelOpen(true);
                              }}
                              className="text-left font-sans text-sm font-semibold transition-colors group flex items-start gap-1.5 focus:outline-none cursor-pointer"
                            >
                              <div>
                                <span className={`border-b border-dashed transition-colors duration-300 ${
                                  profile?.darkMode 
                                    ? 'text-slate-100 border-slate-700 group-hover:text-amber-400 group-hover:border-amber-400' 
                                    : 'text-slate-800 border-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-600'
                                }`}>
                                  {habit.name}
                                </span>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{habit.category}</div>
                              </div>
                            </button>
                          </td>
                          {daysOfWeek.map((day) => {
                            const key = `${habit.id}_${day}`;
                            const isChecked = weeklyProgress ? !!weeklyProgress.completions[key] : false;
                            const isToday = day === todayDayName && !isWeekend && weekId === getMondayOfCurrentWeek().toISOString().substring(0, 10);

                            return (
                              <td 
                                key={day} 
                                className={`p-4 text-center border-b transition-colors duration-300 ${
                                  profile?.darkMode ? 'border-slate-850' : 'border-slate-100'
                                } ${
                                  isToday 
                                    ? profile?.darkMode 
                                      ? 'bg-amber-500/5 border-x border-slate-850' 
                                      : 'bg-amber-50/10 border-x border-slate-100/50' 
                                    : ''
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleHabit(habit.id, day)}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${
                                    isChecked
                                      ? profile?.darkMode 
                                        ? 'bg-amber-500 border-amber-500 text-indigo-950 scale-105 shadow-xs'
                                        : 'bg-indigo-600 border-indigo-600 text-white scale-105 shadow-xs'
                                      : isToday
                                        ? profile?.darkMode 
                                          ? 'border-amber-500 hover:border-amber-400 hover:bg-amber-500/10 bg-slate-950 text-transparent'
                                          : 'border-amber-400 hover:border-amber-500 hover:bg-amber-50/50 bg-white text-transparent'
                                        : profile?.darkMode
                                          ? 'border-slate-800 hover:border-slate-700 bg-slate-950 text-transparent'
                                          : 'border-slate-200 hover:border-slate-350 bg-white text-transparent'
                                  }`}
                                  aria-label={`Mark ${habit.name} completed on ${day}`}
                                >
                                  {isChecked && (
                                    <motion.span
                                      initial={{ scale: 0.5, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: 'spring', damping: 15 }}
                                      className="text-[10px] font-black"
                                    >
                                      ✔
                                    </motion.span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer info */}
              <div className={`p-4 text-white border-t flex items-center justify-between text-[11px] font-sans font-medium transition-colors duration-300 ${
                profile?.darkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-300' 
                  : 'bg-indigo-900 border-slate-200'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Your ticks are written securely and updated instantly.
                </span>
                <span className="text-indigo-200">{habits.length} schemas active</span>
              </div>
            </div>

            {/* Daily Notes Area */}
            <div className={`p-5 rounded-2xl border transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 transition-colors ${
                profile?.darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div>
                  <h4 className={`text-sm font-bold font-sans flex items-center gap-2 ${
                    profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'
                  }`}>
                    <FileText className="w-4 h-4 text-amber-500" />
                    Daily Performance Journal
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Reflect on professional highlights, challenges, and lessons</p>
                </div>

                <div className={`flex items-center gap-1 p-1 rounded-lg border max-w-full overflow-x-auto transition-colors ${
                  profile?.darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      onClick={() => setActiveNoteDay(day)}
                      className={`px-2.5 py-1 text-[11px] font-sans font-bold rounded-md transition-all shrink-0 cursor-pointer ${
                        activeNoteDay === day
                          ? 'bg-amber-400 text-indigo-950 font-bold shadow-xs'
                          : profile?.darkMode
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                            : 'text-slate-500 hover:text-indigo-900 hover:bg-slate-100/50'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea note input */}
              <div className="relative">
                <textarea
                  value={noteContent}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder={`Write your ${activeNoteDay} notes here... e.g. "Arrived early to sync with mentor on task definitions. Participated actively during the product review."`}
                  className={`w-full border rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500 border-l-4 border-l-amber-500 transition-colors resize-none leading-relaxed ${
                    profile?.darkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-750' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 h-32'
                  }`}
                  disabled={loadingProgress}
                />
                
                {/* Auto-save visual feedback indicators */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] font-sans">
                  {isSavingNote ? (
                    <span className="flex items-center gap-1 text-amber-500 font-bold animate-pulse">
                      <Clock className="w-3 h-3" /> Auto-saving...
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 font-medium ${profile?.darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Saved to cloud
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reminder Config Panel */}
            <RemindersPanel onNotifyTest={showToastMessage} isDarkMode={profile?.darkMode} />

            {/* Analytics Section */}
            <div className="space-y-4 pt-2">
              <div className="pb-1">
                <h3 className={`text-base font-extrabold font-sans flex items-center gap-2 ${
                  profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  📈 Progress Analytics & Data
                </h3>
                <p className="text-xs text-slate-500 mt-1">Live statistics computed across your current week completions</p>
              </div>
              <AnalyticsCharts habits={habits} progress={weeklyProgress || { id: weekId, completions: {}, notes: {}, updatedAt: '' }} isDarkMode={profile?.darkMode} />
            </div>

          </div>

          {/* Sidebar / Statistics Column (Right) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Progress Circular Gauge Card */}
            <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center space-y-5 relative overflow-hidden transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="absolute top-0 left-0 w-16 h-16 bg-amber-500/5 rounded-br-full" />
              
              <div>
                <h3 className={`text-base font-extrabold font-sans ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'}`}>Overall Weekly Progress</h3>
                <p className="text-xs text-slate-500 mt-1">Completion target for current active week</p>
              </div>

              {loadingProgress ? (
                <div className={`w-24 h-24 rounded-full animate-pulse border ${profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`} />
              ) : (
                <CircularProgress percentage={overallPercentage} size={130} />
              )}

              <div className="w-full space-y-3 pt-2">
                {/* Visual linear progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-sans text-slate-500 font-medium">
                    <span>Progress bar</span>
                    <span className={`font-bold ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-600'}`}>{Math.round(overallPercentage)}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <motion.div 
                      className={`h-full rounded-full ${profile?.darkMode ? 'bg-amber-400' : 'bg-indigo-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${overallPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Habits Remaining status */}
                <div className={`text-xs font-sans flex justify-between items-center p-2.5 rounded-lg border transition-colors ${
                  profile?.darkMode 
                    ? 'bg-slate-950 border-slate-850 text-slate-300' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span>Checked Habits</span>
                  <span className={`font-bold text-sm ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{totalCheckedThisWeek} / {maxWeeklyChecks}</span>
                </div>
              </div>
            </div>

            {/* Daily completion lists / cards */}
            <div className={`p-5 rounded-2xl border space-y-4 transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h4 className={`text-sm font-extrabold font-sans uppercase tracking-wide flex items-center gap-1.5 ${
                profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'
              }`}>
                <span>📆</span> Daily Completions
              </h4>
              <div className="space-y-2">
                {dailyCompletions.map(({ day, checked }) => {
                  const isCurrentDay = day === todayDayName && !isWeekend && weekId === getMondayOfCurrentWeek().toISOString().substring(0, 10);
                  const completePercent = totalHabits > 0 ? (checked / totalHabits) * 100 : 0;
                  
                  return (
                    <div 
                      key={day}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrentDay 
                          ? profile?.darkMode
                            ? 'bg-amber-500/5 border-amber-500/40 shadow shadow-amber-500/5'
                            : 'bg-indigo-50/60 border-amber-400 shadow shadow-amber-400/5' 
                          : profile?.darkMode
                            ? 'bg-slate-950 border-slate-850'
                            : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${
                            isCurrentDay 
                              ? profile?.darkMode ? 'text-amber-400' : 'text-indigo-950' 
                              : profile?.darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {day}
                          </span>
                          {isCurrentDay && (
                            <span className="text-[8px] bg-amber-400 text-indigo-950 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                              Today
                            </span>
                          )}
                        </div>
                        {/* Day's progress bar */}
                        <div className={`w-24 h-1.5 rounded-full overflow-hidden ${profile?.darkMode ? 'bg-slate-900' : 'bg-slate-200'}`}>
                          <div 
                            className={`h-full ${profile?.darkMode ? 'bg-amber-400' : 'bg-indigo-600'}`}
                            style={{ width: `${completePercent}%` }} 
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded border transition-colors ${
                        profile?.darkMode 
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                          : 'text-indigo-800 bg-indigo-50 border-indigo-100/40'
                      }`}>
                        ✔ {checked} / {totalHabits}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bento Statistics Cards */}
            <div className={`p-5 rounded-2xl border space-y-4 transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h4 className={`text-sm font-extrabold font-sans uppercase tracking-wide flex items-center gap-1.5 ${
                profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'
              }`}>
                <span>📊</span> Statistics Indicators
              </h4>
              <div className="grid grid-cols-2 gap-3 font-sans">
                
                {/* Checked Stats */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors duration-300 ${
                  profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="text-amber-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <div className={`text-xl font-bold ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{totalCheckedThisWeek}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-extrabold tracking-wider">Checked</div>
                  </div>
                </div>

                {/* Current Streak */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors duration-300 ${
                  profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="text-amber-500">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="mt-2">
                    <div className={`text-xl font-bold ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{profile?.currentStreak || 0} days</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-extrabold tracking-wider">Streak</div>
                  </div>
                </div>

                {/* Longest Streak */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors duration-300 ${
                  profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="text-amber-500">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <div className={`text-xl font-bold ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{profile?.longestStreak || 0} d</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-extrabold tracking-wider">Longest</div>
                  </div>
                </div>

                {/* Weekly Goal */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors duration-300 ${
                  profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="text-amber-500">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="mt-2">
                    <div className={`text-xl font-bold ${profile?.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {totalCheckedThisWeek >= (profile?.weeklyGoal || 5) * totalHabits ? '🎯 Yes' : 'No'}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-extrabold tracking-wider">Goal Hit</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Achievements panel */}
            <div className={`border rounded-2xl p-5 transition-colors duration-300 ${
              profile?.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-indigo-50 border-indigo-100'
            }`}>
              {profile ? (
                <AchievementsPanel userProfile={profile} isDarkMode={profile?.darkMode} />
              ) : (
                <div className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Habits Side Details Drawer */}
      <HabitSidePanel
        habit={selectedHabit}
        isOpen={isSidePanelOpen}
        onClose={() => {
          setIsSidePanelOpen(false);
          setSelectedHabit(null);
        }}
        progress={weeklyProgress || { id: weekId, completions: {}, notes: {}, updatedAt: '' }}
        isDarkMode={profile?.darkMode}
      />

      {/* Admin Panel Workspace Settings Modal */}
      {profile && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          habits={habits}
          onRefreshHabits={fetchHabitsAndProgress}
          currentUser={profile}
          isDarkMode={profile?.darkMode}
        />
      )}

      {/* Google Login Iframe/Popup troubleshooting Helper Modal */}
      <AnimatePresence>
        {showLoginHelp && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative space-y-4 ${
                profile?.darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button 
                onClick={() => setShowLoginHelp(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl">
                  <Info className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold font-sans ${profile?.darkMode ? 'text-amber-400' : 'text-indigo-900'}`}>
                    Google Sign-In Troubleshooting
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Resolving browser iframe restrictions</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                profile?.darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'
              }`}>
                This application runs within an <strong>interactive preview iframe</strong>. Modern browsers block secure authentication popups or restrict third-party cookies when nested inside frames.
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-extrabold uppercase tracking-wider ${profile?.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  How to sync successfully:
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-indigo-950 font-bold font-sans rounded-full shrink-0">1</span>
                    <p className="pt-0.5">
                      Look at the top-right corner of the development preview pane and click the <strong>"Open in a new tab"</strong> icon.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-indigo-950 font-bold font-sans rounded-full shrink-0">2</span>
                    <p className="pt-0.5">
                      In the new tab, click <strong>"Google Sync"</strong> again. The Google Auth popup will load cleanly and securely.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-indigo-950 font-bold font-sans rounded-full shrink-0">3</span>
                    <p className="pt-0.5">
                      Once authenticated, your streaks, custom habits, and performance journal notes will immediately sync to the cloud.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowLoginHelp(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-indigo-950 font-bold font-sans rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Understood, close
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA / Web App Step-by-Step Installation Guide Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`w-full max-w-xl p-6 rounded-2xl border shadow-2xl relative space-y-4 ${
                profile?.darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button 
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl">
                  <Smartphone className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold font-sans ${profile?.darkMode ? 'text-emerald-400' : 'text-indigo-900'}`}>
                    Web App Installation Hub
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick setup guidelines for desktop & mobile devices</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Guide */}
                <div className={`p-4 rounded-xl border ${profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Chrome, Edge & Brave</h4>
                  </div>
                  <ol className="text-xs space-y-2 text-slate-400 leading-relaxed list-decimal list-inside pl-1">
                    <li>Look at the right side of your browser's address bar (URL bar).</li>
                    <li>Click the <strong className={profile?.darkMode ? 'text-slate-200' : 'text-slate-700'}>"Install app"</strong> icon (a computer icon with a down arrow).</li>
                    <li>Confirm and click <strong className={profile?.darkMode ? 'text-slate-200' : 'text-slate-700'}>"Install"</strong> to launch the native app context.</li>
                  </ol>
                </div>

                {/* Mobile Guide */}
                <div className={`p-4 rounded-xl border ${profile?.darkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Safari on iOS (Apple)</h4>
                  </div>
                  <ol className="text-xs space-y-2 text-slate-400 leading-relaxed list-decimal list-inside pl-1">
                    <li>Tap the <strong className={profile?.darkMode ? 'text-slate-200' : 'text-slate-700'}>"Share"</strong> icon (square with an up-arrow) at the bottom.</li>
                    <li>Scroll down and tap <strong className={profile?.darkMode ? 'text-slate-200' : 'text-slate-700'}>"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong className={profile?.darkMode ? 'text-slate-200' : 'text-slate-700'}>"Add"</strong> in the top-right. The beautiful 3D icon will appear on your home screen!</li>
                  </ol>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800/10">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-indigo-950 font-bold font-sans rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Understood, let's build routine!
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

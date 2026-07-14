import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { Habit, UserProfile, WeeklyProgress } from '../types';
import { DEFAULT_HABITS } from './habitDefaults';

const HABITS_PATH = 'habits';
const USERS_PATH = 'users';

// Get all habits
export async function getHabits(): Promise<Habit[]> {
  const isLocalGuest = !auth.currentUser || auth.currentUser.uid === 'guest_local_user';
  if (isLocalGuest) {
    const localData = localStorage.getItem('local_habits');
    if (localData) {
      return JSON.parse(localData) as Habit[];
    }
    const seededHabits = DEFAULT_HABITS.map((defHabit, idx) => ({
      ...defHabit,
      createdBy: 'system',
      createdAt: new Date(Date.now() - (10 - idx) * 10000).toISOString()
    }));
    localStorage.setItem('local_habits', JSON.stringify(seededHabits));
    return seededHabits;
  }
  
  try {
    const habitsCol = collection(db, HABITS_PATH);
    const q = query(habitsCol, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    let habits = snapshot.docs.map(doc => doc.data() as Habit);
    
    // Auto-seed if empty
    if (habits.length === 0) {
      console.log('Seeding default habits to Firestore...');
      const batchPromises = DEFAULT_HABITS.map(async (defHabit, idx) => {
        const h: Habit = {
          ...defHabit,
          createdBy: 'system',
          createdAt: new Date(Date.now() - (10 - idx) * 10000).toISOString()
        };
        const docRef = doc(db, HABITS_PATH, h.id);
        await setDoc(docRef, h);
        return h;
      });
      habits = await Promise.all(batchPromises);
    }
    
    return habits;
  } catch (error) {
    console.warn("Firestore lookup failed, using local fallback:", error);
    const localData = localStorage.getItem('local_habits');
    if (localData) {
      return JSON.parse(localData) as Habit[];
    }
    const seededHabits = DEFAULT_HABITS.map((defHabit, idx) => ({
      ...defHabit,
      createdBy: 'system',
      createdAt: new Date(Date.now() - (10 - idx) * 10000).toISOString()
    }));
    localStorage.setItem('local_habits', JSON.stringify(seededHabits));
    return seededHabits;
  }
}

// Save or Update a habit
export async function saveHabit(habit: Habit): Promise<void> {
  const isLocalGuest = !auth.currentUser || auth.currentUser.uid === 'guest_local_user';
  if (isLocalGuest) {
    const habits = await getHabits();
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      habits[idx] = habit;
    } else {
      habits.push(habit);
    }
    localStorage.setItem('local_habits', JSON.stringify(habits));
    return;
  }

  const path = `${HABITS_PATH}/${habit.id}`;
  try {
    const docRef = doc(db, HABITS_PATH, habit.id);
    await setDoc(docRef, habit);
  } catch (error) {
    console.warn("Firestore save failed, saving locally:", error);
    const habits = await getHabits();
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      habits[idx] = habit;
    } else {
      habits.push(habit);
    }
    localStorage.setItem('local_habits', JSON.stringify(habits));
  }
}

// Delete a habit
export async function deleteHabit(habitId: string): Promise<void> {
  const isLocalGuest = !auth.currentUser || auth.currentUser.uid === 'guest_local_user';
  if (isLocalGuest) {
    const habits = await getHabits();
    const updated = habits.filter(h => h.id !== habitId);
    localStorage.setItem('local_habits', JSON.stringify(updated));
    return;
  }

  const path = `${HABITS_PATH}/${habitId}`;
  try {
    const docRef = doc(db, HABITS_PATH, habitId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Firestore delete failed, deleting locally:", error);
    const habits = await getHabits();
    const updated = habits.filter(h => h.id !== habitId);
    localStorage.setItem('local_habits', JSON.stringify(updated));
  }
}

// Get or Create User Profile
export async function getUserProfile(uid: string, defaultEmail?: string, defaultName?: string): Promise<UserProfile> {
  if (uid === 'guest_local_user') {
    const localData = localStorage.getItem(`local_profile_${uid}`);
    if (localData) {
      return JSON.parse(localData) as UserProfile;
    }
    const newProfile: UserProfile = {
      uid,
      email: defaultEmail || '',
      displayName: defaultName || 'Guest Intern (Offline)',
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      weeklyGoal: 3,
      createdAt: new Date().toISOString(),
      isAdmin: false
    };
    localStorage.setItem(`local_profile_${uid}`, JSON.stringify(newProfile));
    return newProfile;
  }

  const path = `${USERS_PATH}/${uid}`;
  try {
    const docRef = doc(db, USERS_PATH, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      // Create a default profile
      const newProfile: UserProfile = {
        uid,
        email: defaultEmail || '',
        displayName: defaultName || 'Anonymous Intern',
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        weeklyGoal: 3,
        createdAt: new Date().toISOString(),
        isAdmin: defaultEmail === 'dewsangam1@gmail.com' ? true : false
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console.warn("Firestore user lookup failed, falling back to local storage profile:", error);
    const localData = localStorage.getItem(`local_profile_${uid}`);
    if (localData) {
      return JSON.parse(localData) as UserProfile;
    }
    const newProfile: UserProfile = {
      uid,
      email: defaultEmail || '',
      displayName: defaultName || 'Guest Intern (Offline fallback)',
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      weeklyGoal: 3,
      createdAt: new Date().toISOString(),
      isAdmin: false
    };
    localStorage.setItem(`local_profile_${uid}`, JSON.stringify(newProfile));
    return newProfile;
  }
}

// Update User Profile
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (uid === 'guest_local_user') {
    const profile = await getUserProfile(uid);
    const updated = { ...profile, ...data };
    localStorage.setItem(`local_profile_${uid}`, JSON.stringify(updated));
    return;
  }

  const path = `${USERS_PATH}/${uid}`;
  try {
    const docRef = doc(db, USERS_PATH, uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.warn("Firestore update user failed, updating locally:", error);
    const profile = await getUserProfile(uid);
    const updated = { ...profile, ...data };
    localStorage.setItem(`local_profile_${uid}`, JSON.stringify(updated));
  }
}

// Get Weekly Progress
export async function getWeeklyProgress(uid: string, weekId: string): Promise<WeeklyProgress> {
  if (uid === 'guest_local_user') {
    const localData = localStorage.getItem(`local_progress_${uid}_${weekId}`);
    if (localData) {
      return JSON.parse(localData) as WeeklyProgress;
    }
    return {
      id: weekId,
      completions: {},
      notes: {},
      updatedAt: new Date().toISOString()
    };
  }

  const path = `${USERS_PATH}/${uid}/progress/${weekId}`;
  try {
    const docRef = doc(db, USERS_PATH, uid, 'progress', weekId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as WeeklyProgress;
    } else {
      // Return a blank template
      const newProgress: WeeklyProgress = {
        id: weekId,
        completions: {},
        notes: {},
        updatedAt: new Date().toISOString()
      };
      // We don't save it immediately to avoid creating empty documents
      return newProgress;
    }
  } catch (error) {
    console.warn("Firestore progress lookup failed, falling back to local storage:", error);
    const localData = localStorage.getItem(`local_progress_${uid}_${weekId}`);
    if (localData) {
      return JSON.parse(localData) as WeeklyProgress;
    }
    return {
      id: weekId,
      completions: {},
      notes: {},
      updatedAt: new Date().toISOString()
    };
  }
}

// Save/Update Weekly Progress
export async function saveWeeklyProgress(uid: string, progress: WeeklyProgress): Promise<void> {
  if (uid === 'guest_local_user') {
    localStorage.setItem(`local_progress_${uid}_${progress.id}`, JSON.stringify(progress));
    return;
  }

  const path = `${USERS_PATH}/${uid}/progress/${progress.id}`;
  try {
    const docRef = doc(db, USERS_PATH, uid, 'progress', progress.id);
    await setDoc(docRef, progress);
  } catch (error) {
    console.warn("Firestore progress save failed, saving locally:", error);
    localStorage.setItem(`local_progress_${uid}_${progress.id}`, JSON.stringify(progress));
  }
}

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Habit, WeeklyProgress } from '../types';
import { CheckCircle, AlertCircle, TrendingUp, Zap } from 'lucide-react';

interface AnalyticsChartsProps {
  habits: Habit[];
  progress: WeeklyProgress;
  isDarkMode?: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ habits, progress, isDarkMode = false }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // 1. Calculate Daily Productivity Data
  const dailyData = days.map(day => {
    let completedCount = 0;
    habits.forEach(habit => {
      const key = `${habit.id}_${day}`;
      if (progress.completions[key]) {
        completedCount++;
      }
    });
    return {
      name: day.substring(0, 3), // Mon, Tue, etc.
      completed: completedCount,
      total: habits.length,
      percentage: habits.length ? Math.round((completedCount / habits.length) * 100) : 0,
    };
  });

  // 2. Calculate Habit Consistency Rate Data
  const habitData = habits.map(habit => {
    let completedCount = 0;
    days.forEach(day => {
      const key = `${habit.id}_${day}`;
      if (progress.completions[key]) {
        completedCount++;
      }
    });
    const rate = Math.round((completedCount / 5) * 100);
    return {
      name: habit.name,
      completed: completedCount,
      rate,
    };
  });

  // Determine Most and Least completed habits
  let mostCompletedHabit = 'None yet';
  let leastCompletedHabit = 'None yet';
  let maxCompletions = -1;
  let minCompletions = 6;

  if (habits.length > 0) {
    habitData.forEach(hd => {
      if (hd.completed > maxCompletions) {
        maxCompletions = hd.completed;
        mostCompletedHabit = hd.name;
      }
      if (hd.completed < minCompletions) {
        minCompletions = hd.completed;
        leastCompletedHabit = hd.name;
      }
    });
  }

  // If there are no completions yet
  const totalCompletionsThisWeek = habitData.reduce((acc, curr) => acc + curr.completed, 0);
  if (totalCompletionsThisWeek === 0) {
    mostCompletedHabit = 'No data yet';
    leastCompletedHabit = 'No data yet';
  }

  // Colors
  const GOLD_COLOR = isDarkMode ? '#fbbf24' : '#f59e0b';
  const INDIGO_COLOR = isDarkMode ? '#6366f1' : '#4f46e5';
  const AXIS_COLOR = isDarkMode ? '#94a3b8' : '#64748b';
  const GRID_COLOR = isDarkMode ? '#1e293b' : '#e2e8f0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Daily Productivity Chart */}
      <div className={`p-5 rounded-2xl border flex flex-col h-80 transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex items-center justify-between mb-4 border-b pb-2 transition-colors ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <h4 className={`text-sm font-bold font-sans flex items-center gap-2 ${
            isDarkMode ? 'text-amber-400' : 'text-indigo-900'
          }`}>
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Daily Productivity
          </h4>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Habits Checked per Day</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" stroke={AXIS_COLOR} fontSize={11} tickLine={false} />
              <YAxis stroke={AXIS_COLOR} fontSize={11} domain={[0, habits.length || 5]} tickCount={habits.length + 1} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                  borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', 
                  borderRadius: '8px', 
                  color: isDarkMode ? '#f8fafc' : '#1e293b', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
                itemStyle={{ color: isDarkMode ? '#fbbf24' : '#4f46e5' }}
              />
              <Bar dataKey="completed" name="Completed Habits" fill={INDIGO_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit Consistency Comparison */}
      <div className={`p-5 rounded-2xl border flex flex-col h-80 transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex items-center justify-between mb-4 border-b pb-2 transition-colors ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <h4 className={`text-sm font-bold font-sans flex items-center gap-2 ${
            isDarkMode ? 'text-amber-400' : 'text-indigo-900'
          }`}>
            <Zap className="w-4 h-4 text-amber-500" />
            Habit Consistency
          </h4>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Completion Rate %</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" stroke={AXIS_COLOR} fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke={AXIS_COLOR} fontSize={10} width={90} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                  borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', 
                  borderRadius: '8px', 
                  color: isDarkMode ? '#f8fafc' : '#1e293b', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value) => [`${value}%`, 'Consistency']}
              />
              <Bar dataKey="rate" name="Consistency" fill={GOLD_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Highlights & Insights Panel */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Most Completed */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`p-3 rounded-full shrink-0 ${
            isDarkMode ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-100 text-amber-600'
          }`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-450 font-mono tracking-wider uppercase font-semibold">Most Completed Habit</div>
            <div className={`text-base font-bold mt-0.5 truncate max-w-[200px] sm:max-w-[300px] ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              {mostCompletedHabit}
            </div>
            {totalCompletionsThisWeek > 0 && (
              <div className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Completed {maxCompletions} / 5 days ({Math.round((maxCompletions/5)*100)}% consistent)
              </div>
            )}
          </div>
        </div>

        {/* Least Completed */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`p-3 rounded-full shrink-0 ${
            isDarkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-450 font-mono tracking-wider uppercase font-semibold">Needs Focus / Growth</div>
            <div className={`text-base font-bold mt-0.5 truncate max-w-[200px] sm:max-w-[300px] ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              {leastCompletedHabit}
            </div>
            {totalCompletionsThisWeek > 0 && (
              <div className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Completed {minCompletions} / 5 days ({Math.round((minCompletions/5)*100)}% consistent)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

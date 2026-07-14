/**
 * Date utilities for the Weekly Habit Tracker
 */

// Format a Date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get the Monday of the week for a given date
export function getMondayOfCurrentWeek(date: Date = new Date()): Date {
  const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const distance = currentDay === 0 ? -6 : 1 - currentDay; // Calculate distance to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + distance);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Get Monday to Friday dates for a given Monday-start week
export function getWorkWeekDays(monday: Date): { name: string; dateStr: string; date: Date }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days.map((dayName, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    return {
      name: dayName,
      dateStr: formatDate(dayDate),
      date: dayDate,
    };
  });
}

// Get standard week identifier, e.g., "Week of July 6, 2026"
export function getWeekRangeLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };
  
  const startStr = monday.toLocaleDateString('en-US', options);
  const endStr = friday.toLocaleDateString('en-US', options);
  const yearStr = monday.toLocaleDateString('en-US', yearOptions);
  
  return `${startStr} – ${endStr}, ${yearStr}`;
}

// Get short day label, e.g. "Mon 7/6"
export function getShortDayLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${weekday} ${month}/${day}`;
}

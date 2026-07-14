import { Habit } from '../types';

export const DEFAULT_HABITS: Omit<Habit, 'createdBy' | 'createdAt'>[] = [
  {
    id: "arrived_on_time",
    name: "Arrived on time",
    category: "Professionalism",
    description: "Be seated, prepared, and ready to engage at least 5-10 minutes before your first work event, meeting, or shift starts.",
    whyItMatters: "Punctuality shows respect for other people's time and reflects personal reliability and structural discipline.",
    benefits: "Demonstrates high reliability, builds early-career trust, and reduces morning rushing stress."
  },
  {
    id: "took_notes",
    name: "Took notes",
    category: "Growth",
    description: "Actively document action items, technical specifications, feedback, and key insights during team meetings or assignments.",
    whyItMatters: "Note-taking keeps your mind focused, minimizes information loss, and acts as a reference library for complex duties.",
    benefits: "Enables fast independent problem solving, ensures you never ask the same question twice, and powers clear project updates."
  },
  {
    id: "asked_a_question",
    name: "Asked a question",
    category: "Communication",
    description: "Engage productively during meetings, brainstorming sessions, or standups by asking clarifying, strategic, or curiosity-driven questions.",
    whyItMatters: "Inquiring shows you are actively processing the information, desire to understand the big picture, and have courage to seek clarity.",
    benefits: "Deepens team alignment, clarifies hidden requirements, and builds confident public speaking habits."
  },
  {
    id: "completed_tasks",
    name: "Completed tasks",
    category: "Productivity",
    description: "Work diligently on your core daily assignments, meet deadlines, and deliver well-tested, high-quality results.",
    whyItMatters: "Consistent execution establishes technical competency and proves your accountability as a professional.",
    benefits: "Maintains team velocity, boosts your self-efficacy, and creates tangible portfolio highlights for performance reviews."
  },
  {
    id: "showed_positive_attitude",
    name: "Showed positive attitude",
    category: "Culture",
    description: "Maintain a solution-oriented mindset, support colleagues, smile, and engage with team members with a friendly, positive posture.",
    whyItMatters: "A positive work atmosphere enhances project momentum, reduces friction, and makes people excited to work alongside you.",
    benefits: "Fosters psychological safety, increases team trust, and marks you as an exceptional culture fit for leadership roles."
  }
];

export const MOTIVATIONAL_QUOTES = [
  "Small daily habits create successful professionals.",
  "Consistency beats motivation.",
  "Arrive 10 minutes early every day this week.",
  "Great habits build great careers.",
  "The secret of your future is hidden in your daily routine.",
  "What you do every day matters more than what you do once in a while.",
  "Professionalism is not an action, it is a habit."
];
export const PRESET_REMINDERS = [
  { id: "rem1", time: "08:00", message: "☀️ Good morning! Remember to arrive 10 minutes early and set your goals today.", enabled: true },
  { id: "rem2", time: "12:00", message: "📝 Halfway through the workday! Are you taking notes and asking great questions?", enabled: true },
  { id: "rem3", time: "17:00", message: "🔥 Workday wrap-up! Log your completed tasks and check off your professional habits.", enabled: true }
];

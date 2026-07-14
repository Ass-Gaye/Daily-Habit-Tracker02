# 📆 Weekly Habit Tracker

A modern, highly polished, and responsive full-stack **Weekly Habit Tracker** designed to build consistent professional discipline, elevate workplace productivity, and track daily progress with interactive feedback. 

With cloud-synced storage, dynamic light/dark modes, rich interactive analytics, and gamified achievements, this tracker helps professionals establish strong work ethics through actionable category tracking.

---

## 🎨 Visual Identity & Theme

The app is built around a cohesive, high-contrast visual design that adapts effortlessly to the user's focus:
*   **Aura Navy Theme (Light Mode)**: Generous negative space, crisp typography pairing **Inter** (sans-serif display) and **JetBrains Mono** (monospaced data highlights), featuring warm amber-to-indigo gradients.
*   **Cosmic Slate Theme (Dark Mode)**: Eye-safe midnight slate color palette (`bg-slate-950`), custom ambient amber border glow accents (`text-amber-400`), and dark card components with subtle borders.
*   **Fluid Transitions**: Fluid layout and micro-interactions powered by **Framer Motion** (`motion/react`) guide focus during checks, sidebar toggles, and week navigation.

---

## ✨ Key Features

### 1. Work-Week View & Navigation
*   **Core 5-Day Work Week**: Displays Monday through Friday with dynamically calculated date badges (e.g. `Mon 7/13`).
*   **Time Travel Navigation**: Travel through historical weeks or advance to future planning. Easily return to the "Current Week" with one click.
*   **Contextual Quotes**: Top motivational banner that dynamically updates based on the active week to keep focus high.

### 2. Workbook Habits Checklist
*   **Pristine Grid Interface**: Interactive list of daily professional responsibilities:
    1.  **Arrived on time** (*Professionalism*)
    2.  **Took notes** (*Growth*)
    3.  **Asked a question** (*Communication*)
    4.  **Completed tasks** (*Productivity*)
    5.  **Showed positive attitude** (*Culture*)
*   **Interactive Ticks**: Instantly mark completions with responsive checked states and fluid visual scaling.

### 3. Daily Performance Journal
*   **Integrated Note Taking**: Expandable diary for writing professional notes and standup logs for each day of the week.
*   **Debounced Cloud Auto-Saving**: Write and watch your logs seamlessly sync to Firestore in the background with auto-saving indicators.

### 4. Progress Analytics & Visualizations
*   **Overall Progress Circular Gauge**: A beautiful animated circular progress bar showing real-time success percentage.
*   **Bento-Grid Statistics**: Highly scannable cards displaying checked habit counts, current streaks, longest historic streaks, and weekly goals status.
*   **Interactive Analytics Charts**: Powered by **Recharts**, visualizing:
    *   *Daily Checklist Completion Velocity* (Line Graph)
    *   *Habit Success Distribution by Category* (Radar/Polar Analytics)
    *   *Stacked Completion History* (Stacked Bar Chart)

### 5. Gamified Achievement System
*   **Dynamic Visual Badges**: Earn real accomplishments, including:
    *   🥇 *Punctual Professional* (Perfect attendance)
    *   🔥 *Habit Pioneer* (Starting your first habit)
    *   📝 *Active Chronicler* (Detailed journals)
    *   🏆 *Streak Master* (Multiple consecutive days)
*   **Earned Toast Alerts**: Staggered real-time notifications slide in when a new achievement is unlocked.

### 6. Personal Reminders & Trigger Panel
*   **Preset Notifications**: Trigger alert systems to check your goals at 8:00 AM, 12:00 PM, and 5:00 PM.
*   **Custom Toast Testing**: Simulate browser notification behaviors immediately within the sandboxed environment.

### 7. Administrative Customization Panel
*   **Admin Mode Toggle**: Safe local development/sandbox review mode enabling users to add, update, or remove pre-configured habits directly from the interface.

---

## 🛠️ Architecture & Technology Stack

```
+------------------------------------------------------------------+
|                          React 18 SPA                            |
|             (Vite + TypeScript + Tailwind CSS)                    |
+-------------------------------+----------------------------------+
                                |
                                | (Firestore Queries & Auth)
                                v
+------------------------------------------------------------------+
|                   Cloud Database (Firestore)                     |
|           - Secure Auth Profiles (`/profiles/{uid}`)             |
|           - Relational Weekly Ticks (`/weekly_progress/{id}`)    |
|           - Custom Configured Habits (`/habits/{id}`)            |
+------------------------------------------------------------------+
```

### Technical Stack Highlights:
*   **Frontend**: React 18 with modern React hooks.
*   **Build System**: Vite (configured for quick compilation and seamless rendering in iframe).
*   **Styling**: Utility-first **Tailwind CSS** with responsive desktop-first styling grid layouts.
*   **Animations**: Staggered list entrances, side panels, and modal backdrops driven by **Framer Motion** (`motion/react`).
*   **State & Database**: Secure real-time bindings to **Firebase Firestore** and persistent local authentication storage.
*   **Lint & Build Validation**: Verified TypeScript compilation with `tsc --noEmit`.

---

## 🚀 Application Workflow

### Step 1: Initialization & Profile Setup
When the application loads, it initializes the current week starting on Monday and authenticates the user. If it's a first-time user, a new profile is generated, pre-populating standard professional habits (`DEFAULT_HABITS`) and initializing streaks to `0`.

### Step 2: Selecting the Work Week
Use the top-right navigation header to slide between past and future weeks. The workspace adjusts dates dynamically, loading completion ticks and journals associated with that specific week identifier (`YYYY-MM-DD` of Monday).

### Step 3: Performing Daily Audits
*   **Ticks & Progress**: As you perform habits at work, click on the checklist grids. Toggling an item triggers a Firestore merge write, updating your streak metrics and recalculating the overall weekly success gauge.
*   **Detailed Exploration**: Click on any habit's name to slide out the **Habit Side Panel**. Read why it matters, review its professional benefits, and see an inspection log of exactly which days you completed it.

### Step 4: Writing Daily Journals
Select a specific day from the Daily Performance Journal selector (e.g. `Mon`, `Tue`, `Wed`). Type your notes (e.g., meeting logs, action items, barriers). The editor automatically schedules an auto-save operation after a short delay, storing your data safely in Firestore.

### Step 5: Checking Trends & Analytics
Scroll down to the analytics dashboard to review interactive charts. Analyze which habit categories (Growth vs. Professionalism) are leading and see your completion patterns over the course of the week.

### Step 6: Leveling Up & Unlocking Achievements
As you check off habits and complete journal entries, the background Achievement Engine computes whether you meet specialized milestone conditions. Unlocking an achievement triggers a slide-in banner, saving the earned badge permanently to your cloud profile.

---

## 💻 Local Development

Follow these steps to run and build the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The server will boot up and serve the application locally.

### 3. Production Build
```bash
npm run build
```
Compiles and bundles the assets into the `/dist` directory.

---

*This application represents modern full-stack engineering, combining elegant typography, durable cloud persistence, and high-quality UI aesthetics into a robust self-improvement workbook.*

# Focus Plan M3E (owner's wishes, cleaned up)

Authority order for agents: AGENTS.md (rules), docs/cursor-plan.md (current plan, wins on conflicts), docs/ai-studio-plan.md (earlier plan), this file (the owner's original idea). This file does not repeat the design and anti-template rules; those live in AGENTS.md. If anything here is missing from the current plan, list it for the owner. Do not silently build it or drop it.

## Licensing and reference rule (overrides the original wording)

The owner originally wrote "copy all features" and "use Tomato's code". The correct rule is:
- Pomofocus (https://pomofocus.io/app) is a commercial product. Study its behavior only.
- bermarte/pomofocus (https://github.com/bermarte/pomofocus) is a partial MIT student timer, not the real site. Study it for behavior. Any reuse must keep the MIT notice.
- Tomato (https://github.com/nsh07/Tomato) is GPL-3.0. Study behavior, design and structure only. Write original TypeScript. Do not copy its source, assets or copy text.
- To read the references: use web fetch of the docs and READMEs first. If a clone is needed, use a shallow clone (`git clone --depth 1`) into a temporary folder OUTSIDE this project, read it, then delete it. Disk space on this machine is tight; ask before cloning anything large.
- Design sources: https://m3.material.io, https://m3.material.io/develop/web, https://github.com/Ivorisnoob/Material-3-Expressive-Guide-For-you-AI.

## Goal

A responsive web app (PWA) that matches the feature set of Pomofocus and Tomato (focus timer, tasks, total-time-focused graphs, notifications, Material 3 Expressive look), with a standout study-tracking layer on top. It must be able to expand later to run natively on Android. It follows the browser's light or dark mode (the Chrome theme itself is not readable by pages; see DECISIONS.md). It has animations, a simple landing page that showcases the app, and runs on any screen size.

Library priority: Google libraries by default. If unavailable, use the owner's list: anime.js, motion.dev, Kokonut UI, Bklit UI, and Manus.im as a layout reference. Material 3 Expressive is the main focus. The other libraries are only a backup.

## Study tracking (the feature that makes the app stand out)

- Categories and tasks. A pomodoro can be tied to a task or a topic. Categories: Work, Extracurriculars, School, Study, Standardized tests, and more (custom allowed). In each category the user creates tasks, sets a minimum and maximum goal for each, and sets how often it repeats: hourly, daily, weekly, and so on.
- Test goals. Example: studying for the SAT, with two sections (Reading and Writing, Math), each scored out of 800. For each section the user sets a target score, study time, how many times per week they study, and the test date. The app sends reminders about the goal.
- Streaks. The user must complete 3 or more pomodoros in a day, on any tasks they like, to start and keep a streak.
- Badges. Badges show progress. Example: today's goal was 4 sessions and the user did 8, which is 200 percent. Streak milestones also earn badges.
- Score loop. After the user takes the test, the app asks for the score, works out how much of the goal that is, and shows progress, so that by the next trial the score is better.
- Test catalog. Saudi: GAT, SAAT, STEP, KFUPM Early SAAT. International: IELTS, TOEFL, SAT, Duolingo, ACT. Each test comes with its sections, data and deadlines ready to select. The user can also create a custom test. Every official date is labeled "verify on the official site" and only confirmed data is filled in.
- Reminders for goals and test dates.

## Social and rewards

- Friend groups. Create a group, add friends, share an invite link or code. Groups can have a task together.
- Focus points. Whoever studies longest in a day gets a focus point. The weekly leader gets 7 points.
- Store. Coins are spent on streak freezes (in case the user misses a day) and break multipliers (example: 8 sessions in a day gives a 30 minute long break instead of 60).
- Public leaderboard. Opt in only.
- Profiles. Friends can see each other's profile, tasks, focus time, stats and badges, but only the fields that user has turned on in account settings.

## Backend and integrations

- Firebase for Google login and leaderboard data (free Spark plan, no Cloud Functions for now).
- Later, only when the owner asks: Google Tasks, Google Calendar, Gemini study plans, push notifications, Capacitor or native Android.

## Deliverables the owner asked for

- CODEBASE.md and README.md (README with screenshots of the app).
- A GitHub repo, published on GitHub Pages, open for pull requests, improvements and suggestions.
- Landing page that shows the real app.
- English and Arabic with full RTL.

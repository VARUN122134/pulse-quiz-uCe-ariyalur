# PULSE Science Club — Students' Day Quiz Website

Anna University, University College of Engineering Ariyalur • World Students' Day Oct 15

## Run locally
Just open `index.html` in a browser, or:
```powershell
cd C:\Users\Varun\quiz-site
npx serve .
```

## Deploy (for tomorrow — pick one)

**Vercel (recommended):**
1. Push this folder to GitHub, then Import in Vercel as static site. No build command.
2. Or: `npx vercel` inside this folder.

**Netlify:**
- Drag-drop this folder onto https://app.netlify.com/drop → instant public URL to WhatsApp to students.

No env vars needed — Supabase URL + publishable key are already in `app.js` (anon only, safe for frontend).

## Supabase backend
- Table: `public.quiz_attempts` (role student/faculty, name, dept, year, reg_number, score/250, time_taken_secs, answers jsonb)
- One attempt per reg_number enforced by unique partial index.
- RLS: anon can INSERT + SELECT (public leaderboard). Faculty rows excluded via `role='student'` filter in app.
- Project: https://oekdpzoewzkznxghmgby.supabase.co

## Quiz rules coded
- 25 MCQs, 10 pts each = 250 max. One at a time, Next/Previous, palette jump, `Question X of 25`, progress bar.
- 15:00 timer, auto-submit. Correct answers hidden during quiz, revealed on result page with review.
- Student form: name, year, dept, reg no. Faculty: name, dept only (not ranked).
- Leaderboard: public, Top 3 podium 🥇🥈🥉, tie-break = faster time. Auto-refresh.

## Files
- `index.html` — all 5 views (home/register/quiz/result/leaderboard)
- `styles.css` — navy/maroon/gold college theme, responsive
- `app.js` — questions + logic + Supabase
- `assets/logo.jpeg`, `assets/poster.jpeg` — from E:\quiz

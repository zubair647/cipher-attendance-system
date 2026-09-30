# Going live — deployment guide (v2: PWA + push reminders)

This takes the working apps online so mentors can install the app on their
phones and get the check-in/check-out reminders. Everything below is free.

There are **5 parts**. Do them in order. I've pre-filled every value you need to
paste — you never have to invent anything.

> 🔒 **Keep these secret** (they're already kept out of git for you): the VAPID
> private key and the CRON secret. Only paste them where this guide says.

---

## Your values (copy-paste bank)

| Name | Value |
|---|---|
| `CIPHER_BACKEND_URL` | `https://script.google.com/macros/s/AKfycbyiYRCQtcv9KiqIKGbaWdLnl15rG137tawWHN3wNayzmGM3S9k9SV3uMLqJ8OKljNCQjw/exec` |
| `ADMIN_EMAIL` | `admin@cipherschools.com` |
| `ADMIN_PASSWORD` | `admin123` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BEDJwEZX2Zgjp9z292fr3Txx45alDVbu_dkcBkUA4QsUbiTIJA55ZjlAg8G6iB-ZPJGgFacM28V4w2kAyketR78` |
| `VAPID_PRIVATE_KEY` | `4C-1AUlRpXhu4VIu6DnmRf9G1MbZdB3w3R3hWkR_duE` |
| `VAPID_SUBJECT` | `mailto:admin@cipherschools.com` |
| `CRON_SECRET` | `2ede34003f6b6265a6263d3f23a34b7e5a96d5c18dd88902` |

---

## Part 1 — Update your backend (adds push storage)

Your Apps Script needs three new commands to store which phones to notify.

1. Open your Sheet → **Extensions ▸ Apps Script**.
2. Open **`Code.gs`**, select all, delete, and paste in the newest **Code.gs**
   I sent (it has the push additions). **💾 Save.**
3. **Deploy ▸ Manage deployments ▸ ✏️ pencil ▸ Version: New version ▸ Deploy.**
   (Same URL as always.)

That's the only backend change. A `PushSubscriptions` tab will appear on its own
the first time a mentor turns on notifications.

---

## Part 2 — Put the code on GitHub

If it's already on GitHub, just make sure your latest code is pushed, and skip to Part 3.

Easiest way (no command line): **GitHub Desktop**.
1. Install from **https://desktop.github.com** and sign in.
2. **File ▸ Add Local Repository** → choose the `cipher-attendance-system` folder.
3. If prompted "create a repository," do it. Then **Publish repository** →
   name it, choose **Private**, Publish.
4. Whenever you change code later: type a summary, **Commit**, then **Push origin**.

> The `.gitignore` already keeps secrets (`.env.local`) and junk (`node_modules`)
> out of GitHub automatically.

---

## Part 3 — Deploy the MENTOR app on Vercel

1. Go to **https://vercel.com** → **Sign Up** → **Continue with GitHub** (one click).
2. **Add New… ▸ Project** → find your `cipher-attendance-system` repo → **Import**.
3. Configure:
   - **Root Directory:** click **Edit** → choose **`mentor-app`**.
   - **Framework Preset:** Next.js (auto-detected).
   - Expand **Environment Variables** and add these (Name → Value), from the bank above:
     - `CIPHER_BACKEND_URL`
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_SUBJECT`
     - `CRON_SECRET`
4. Click **Deploy**. Wait ~2 minutes.
5. Copy the live URL it gives you (e.g. `https://cipher-mentor-xxxx.vercel.app`).
   **This is your mentor app URL — save it.**

> If the build fails mentioning a missing `@cipher/shared`: in the project's
> **Settings ▸ General**, turn ON **"Include files outside the root directory
> in the Build Step"**, then **Redeploy**. (This lets the app see the shared code.)

---

## Part 4 — Deploy the ADMIN app on Vercel

Same steps, second project:
1. **Add New… ▸ Project** → same repo → **Import** again.
2. **Root Directory:** **`admin-app`**.
3. Environment Variables:
   - `CIPHER_BACKEND_URL`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
4. **Deploy** → copy the admin URL (e.g. `https://cipher-admin-xxxx.vercel.app`).

You now have two live URLs: one for mentors (phone), one for you (admin, desktop).

---

## Part 5 — Turn on the reminder scheduler (GitHub Actions)

The reminders fire from a free scheduler already included in your repo
(`.github/workflows/reminders.yml`). It just needs two secrets:

1. On GitHub, open your repo → **Settings ▸ Secrets and variables ▸ Actions**.
2. **New repository secret**, add these two:
   - Name `MENTOR_APP_URL` → Value = your **mentor app URL** from Part 3 (no trailing slash).
   - Name `CRON_SECRET` → Value = the `CRON_SECRET` from the bank above.
3. Go to the repo's **Actions** tab. If it says workflows are disabled, click
   **"I understand… enable workflows."**

The reminders will now fire automatically at 9:00, 10:00, 11:00 am and 4:00,
4:45, 5:00 pm IST.

**Test it right now (don't wait for 9am):**
1. Actions tab → **"Attendance reminders"** → **Run workflow** → pick a slot like
   `checkin_0900` → **Run workflow**.
2. On a phone where you installed the app and allowed notifications (see below),
   you should get the notification within a few seconds.

---

## Trying it on your phone
1. Open your **mentor app URL** in the phone's browser (Chrome on Android, Safari on iOS).
2. Log in (`aditi.sharma@cipherschools.com` / `mentor123`).
3. **Install:** Android shows an "Install the app" button; iOS → Share ▸ **Add to Home Screen**.
4. **Open the app from the new home-screen icon** (important on iOS — push only
   works when launched from the installed icon, iOS 16.4+).
5. Tap **Enable** on the reminders card, and allow notifications.
6. Try a real check-in with the camera. 🎉

---

## Notes & limits (so nothing surprises you)
- **First load after idle is slow** (~10–15s): that's Google Apps Script waking
  up from cold. Normal, and it's snappy afterwards.
- **iOS notifications** require the app be installed to the home screen and opened
  from there (Apple's rule, not ours).
- **GitHub's scheduler** can be a few minutes late and pauses after ~60 days of no
  repo activity — fine for reminders, but worth knowing.
- **To change reminder wording or times:** edit `packages/shared/reminders.js`
  (text) and `.github/workflows/reminders.yml` (times), commit, push.
- **Passwords are still basic** (admin in env, mentors hashed in the Sheet). Good
  enough for internal use; a production rebuild would harden this.

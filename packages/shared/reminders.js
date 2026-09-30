/**
 * Canonical push-reminder content + schedule for mentors (IST).
 * Single source of truth — the scheduler/dispatch (built in the push stage)
 * reads from here so the copy lives in one editable place.
 *
 * Notification title/body render as PLAIN TEXT (no bold/italics), so emphasis
 * from the original copy is kept as wording/caps/emoji, not markdown.
 *
 * Skip logic (applied by the scheduler, not stored here):
 *   - 'checkin' reminders  → skip a mentor who has already checked in today.
 *   - 'checkout' reminders → skip a mentor who has already checked out today,
 *                            AND skip anyone who never checked in today.
 *   - A mentor on leave today gets NONE of these.
 *   - The same slot is never sent to the same mentor twice.
 */
module.exports = {
  timezone: 'Asia/Kolkata',
  reminders: [
    {
      slot: 'checkin_0900',
      time: '09:00',
      type: 'checkin',
      title: 'Attendance won’t mark itself, boss 👀',
      body: 'One tap now = no “Bhai, check-in hua?” message later 😭 Start the day peacefully — check in!',
      cta: 'Check In',
    },
    {
      slot: 'checkin_1000',
      time: '10:00',
      type: 'checkin',
      title: '10 baj gaye… attendance kidhar hai? 👀',
      body: 'You’ve probably started work. Your attendance hasn’t 😅 Take 5 seconds and check in before it becomes that conversation.',
      cta: 'Check In Now',
    },
    {
      slot: 'checkin_1100',
      time: '11:00',
      type: 'checkin',
      title: 'Bhai… ab toh check in kar do 😭',
      body: 'It’s 11 AM and we’re still waiting for your check-in. Do it now before your phone rings for a completely unrelated reason… 📞👀',
      cta: 'Check In Now',
    },
    {
      slot: 'checkout_1600',
      time: '16:00',
      type: 'checkout',
      title: 'Mentally checked out already? 😌',
      body: 'Fair enough 😂 But before you disappear, remember to actually check out once you’re done for the day.',
      cta: 'Check Out',
    },
    {
      slot: 'checkout_1645',
      time: '16:45',
      type: 'checkout',
      title: 'Bag packed? Laptop closed? 👀',
      body: 'Nice. But there’s one tiny side quest left — CHECK OUT 😭 One tap and you’re officially free.',
      cta: 'Check Out Now',
    },
    {
      slot: 'checkout_1700',
      time: '17:00',
      type: 'checkout',
      title: 'Final call before someone calls you 📞😂',
      body: 'You survived the day. Don’t let your check-out be the reason for one more call 😭 Tap it. Done. Disappear peacefully. ✌️',
      cta: 'Check Out',
    },
  ],
};

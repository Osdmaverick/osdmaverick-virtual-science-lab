# Phase 11 — In-app notifications

## Features
- A private notifications inbox for signed-in users.
- Publishing a class announcement automatically creates one notification for each currently enrolled student.
- Notifications include the announcement title and a shortened message preview.
- Students can open the class announcements page, mark one notification as read, or mark all as read.
- The inbox shows unread and total counts and supports manual refresh.

## Setup
1. Apply migrations 1–11 in order.
2. Configure `assets/supabase-config.js` with the Supabase Project URL and publishable key.
3. Publish an announcement from a teacher account in a class with enrolled students.
4. Sign in as an enrolled student and open `notifications.html`.
5. Confirm the notification appears and test individual and bulk read actions.

## Security and delivery
- RLS restricts notification reads and read-state updates to the recipient.
- Client roles cannot insert or delete notifications. A database trigger creates them when an announcement is published.
- Notifications are created for students enrolled at publish time; students who join later do not receive historical alerts.
- This phase provides in-app notifications only. Email, SMS, browser push and realtime delivery are not included.
- Live RLS verification requires a configured Supabase project and separate teacher/student accounts.

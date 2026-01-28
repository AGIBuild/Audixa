# Change: Learning time statistics (30-day window)

## Why
Learners need clear feedback on study time over recent periods and by resource, but the desktop app currently provides no learning time statistics.

## What Changes
- Track learning time sessions during playback.
- Aggregate stats for today, last 7 days, last 30 days, and by media source.
- Automatically remove session data older than 30 days.

## Impact
- Affected specs: learning-engine, desktop-app, desktop-data
- Affected code: playback event tracking, repository, sqlite migrations, listening UI

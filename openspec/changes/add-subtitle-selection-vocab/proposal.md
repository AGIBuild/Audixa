# Change: Subtitle selection lookup and vocabulary add

## Why
Subtitle readers need a fast way to look up and save words directly from the subtitle list, with real definitions and pronunciations.

## What Changes
- Add subtitle text selection lookup with a popover in the player subtitle list.
- Integrate an online dictionary provider for real definitions/pronunciations.
- Persist pronunciation data alongside vocabulary entries.

## Impact
- Affected specs: learning-engine, desktop-app, desktop-data
- Affected code: subtitle list UI, vocabulary repository, sqlite migrations, lookup client

# Change: Add embedded subtitle extraction and selection

## Why
Users expect subtitles to prefer embedded tracks from the video and fall back to same-name external subtitle files. They also need to select which subtitle track to display.

## What Changes
- Extract embedded subtitle streams from local/WebDAV media using bundled ffprobe/ffmpeg sidecars.
- Prefer embedded subtitles, fallback to same-name external subtitle files.
- Add subtitle selection UI and “Off” option.
- Feed parsed subtitles into the existing subtitle overlay and mask logic.

## Impact
- Affected specs: `subtitles`
- Affected code: `apps/desktop` playback, subtitle parsing, and player UI

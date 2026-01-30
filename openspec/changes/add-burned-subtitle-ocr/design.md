## Context
Some media sources contain burned-in subtitles, which are part of the video pixels and cannot be controlled like embedded tracks. We need to detect burned-in subtitles, mask them, and offer online subtitle replacements.

## Goals / Non-Goals
- Goals:
  - Detect burned-in subtitles using OCR over sampled frames.
  - Provide a mask overlay for the detected subtitle region.
  - Allow online subtitle replacement via OpenSubtitles and cache results locally.
  - Integrate the replacement flow into the subtitle track menu.
- Non-Goals:
  - Manual mask selection or adjustment.
  - OCR-based subtitle editing or translation.
  - Cloud OCR services.

## Decisions
- Decision: Use bundled Tesseract.js OCR for burned-in detection.
  - Rationale: offline-capable OCR without native sidecar maintenance.
- Decision: Configure OCR languages via app settings (default `eng`).
  - Rationale: allow multi-language detection without code changes.
- Decision: Run burned-in detection only when no embedded or external subtitle tracks exist.
  - Rationale: avoid unnecessary OCR cost and false positives.
- Decision: Use a stable-region heuristic based on OCR bounding boxes across sampled frames.
  - Rationale: simple, deterministic, and fast to implement.
- Decision: Use OpenSubtitles as the online subtitle source.
  - Rationale: broad catalog and stable API.

## Risks / Trade-offs
- False positives/negatives for burned-in detection.
- OCR performance on low-end devices.
- API key handling and rate limits for OpenSubtitles.
- Increased bundle size from OCR binaries.

## Migration Plan
- Add OCR sidecar packaging and commands first.
- Introduce burned-in detection and mask overlay behind the new subtitle replacement option.
- Roll out OpenSubtitles search and caching once detection is stable.

## Open Questions
- Where to store the OpenSubtitles API key (app settings vs environment)?
- Should we allow users to disable burned-in detection for performance?

# Vendored libraries

## soundfont2

- Source: <https://github.com/Mrtenz/soundfont2>
- Version: 0.5.0
- License: MIT (see `soundfont2.LICENSE`)
- File: `soundfont2.js` (UMD browser build, exposes `window.SoundFont2`)

Parses SoundFont 2 (`.sf2`) files into samples, presets, instruments, and
zone generators. Used by the SF2-based instrument path so chord notes can
sustain via the SF2's embedded loop markers (the same approach openDAW
uses for its built-in instruments).

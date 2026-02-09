# Overwolf Log Files Analysis Guide

This document provides instructions for analyzing Overwolf log files when debugging issues with Overwolf apps.

## Log Location

All Overwolf logs are stored in: `%LOCALAPPDATA%\Overwolf\Log`

Access via Windows Key + R, then enter the path above.

## Log File Types

### 1. Trace Logs (`Trace_<yyyy-mm-dd_hh-mm_xxxxx>.log`)

**Purpose**: Documents all Overwolf platform actions and system state.

**Contains**:
- System environment (Overwolf version, OS info)
- User login status and settings
- GPU scheduling settings
- Running extensions and their status
- Process lifecycle events
- Potential system conflicts
- Game detection scoring

**Log Entry Format** (5 components per line):
```
[Timestamp] [Entry Type] [Component/Thread ID] [PID] [Service and Description]
```

**Entry Types to Watch**:
- `WARN` - Warnings that may indicate problems
- `ERROR` - Errors that need investigation

**Use Cases**:
- App loading/opening problems
- Overlay issues
- Third-party software interference
- Extension conflicts
- Game detection issues

**Analysis Tips**:
- Search for your extension ID to track its lifecycle
- Look for `ERROR` and `WARN` entries
- Check GPU information for rendering issues
- Verify game detection scores for overlay problems

---

### 2. Overlay Game HTML Logs (`<GameName>_<date>_<time>.Game.html`)

**Purpose**: Tracks how Overwolf integrates with specific games.

**Contains**:
- Process names and injected DLLs (including Overwolf's)
- Game window mode and resolution
- Rendering API used
- Hotkey activity (sent and received)
- OBS render hook injection status
- Render success/failure status
- Game termination status (normal vs crash)
- Client initialization and Windows OS details

**Use Cases**:
- Overlay not appearing in game
- DLL injection conflicts with other software
- Hotkey not working
- Rendering failures
- Game crash detection

**Analysis Tips**:
- Check "Render Success Status" section first
- Look for third-party DLLs that might conflict
- Verify hotkeys are being received
- Check if OBS hook injection succeeded (for recording)

---

### 3. OBS Logs

**Purpose**: Tracks Open Broadcaster Software engine operations for game recording.

**Contains**:
- System details and driver versions
- Display and sound devices
- Recording configuration (resolution, FPS, bitrate, encoder)
- Recording session history

**Use Cases**:
- Recording not starting
- Poor recording quality
- Audio issues in recordings
- Encoder problems

**Analysis Tips**:
- Verify display/audio devices match expected configuration
- Check encoder settings against system capabilities
- Look for driver version issues

---

### 4. OverwolfPerf Logs

**Purpose**: Performance monitoring for Overwolf client and apps.

**Contains**:
- CPU usage per process
- Memory (RAM) usage per process
- Performance metrics over time

**Use Cases**:
- App causing system slowdown
- Memory leaks
- High CPU usage
- Freezing issues

**Analysis Tips**:
- Identify which app/process is consuming excessive resources
- Compare CPU/memory usage against normal baselines
- Look for memory growth over time (potential leaks)

---

### 5. DxDiag (DirectX Diagnostic)

**Purpose**: Windows system hardware and DirectX information.

**Contains**:
- OS version and build
- Processor information
- Display device and driver info
- Sound device configuration
- DirectX components status

**Use Cases**:
- Hardware compatibility issues
- Driver problems
- Minimum requirements verification
- DPI scaling issues (4K monitors)

**Key Things to Verify**:
- Windows version is up to date
- Graphics drivers are current
- System meets Overwolf minimum requirements
- DPI settings (>100% can cause display issues)

---

## Common Debugging Workflows

### Overlay Not Showing
1. Check **Trace log** for extension loading errors
2. Check **Game HTML log** for render success status
3. Verify DLL injection succeeded
4. Look for conflicting third-party DLLs

### App Not Starting
1. Check **Trace log** for `ERROR` entries
2. Search for extension ID in trace log
3. Look for initialization failures
4. Check for missing dependencies

### Performance Issues
1. Check **OverwolfPerf** for CPU/memory usage
2. Identify the problematic process
3. Check **Trace log** for related errors
4. Disable suspect app and verify improvement

### Recording Problems
1. Check **OBS logs** for encoder/device issues
2. Verify audio/video device configuration
3. Check **Game HTML log** for OBS hook status
4. Compare system specs against recording requirements

### Hotkeys Not Working
1. Check **Game HTML log** for hotkey activity
2. Verify hotkeys are being sent to game
3. Look for conflicts with other software
4. Check if overlay is rendering successfully

---

## Quick Reference Commands

**Open log folder**:
```
Win+R -> %LOCALAPPDATA%\Overwolf\Log
```

**Find recent trace logs**:
Look for `Trace_*.log` sorted by date

**Find game-specific logs**:
Look for `<GameName>_*.Game.html` files

---

## When Analyzing Logs for Users

When a user provides Overwolf logs for analysis:

1. **Start with Trace logs** - Get the big picture of what happened
2. **Check for ERROR/WARN entries** - These are usually the root cause
3. **Cross-reference with Game HTML logs** - For overlay-specific issues
4. **Check OverwolfPerf** - If performance is the complaint
5. **Review DxDiag** - For hardware/driver compatibility issues

Always look at timestamps to correlate events across different log files.

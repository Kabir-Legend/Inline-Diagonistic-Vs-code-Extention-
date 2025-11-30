# Inline Diagnostics - VS Code Extension

A production-grade Visual Studio Code extension that enhances how diagnostics (errors, warnings, hints, info) are displayed inline in the editor.

## Features

### Compact Mode (Cursor NOT on diagnostic line)
- Shows a compact bubble to the right of the line
- Colored dot indicator based on severity
- Optional count for multiple diagnostics
- No text shifting or layout changes
- Stable decorations even while typing

### Expanded Mode (Cursor IS on diagnostic line)
- Full inline message displayed after the code text
- Severity icon (error/warning/info/hint)
- Theme-aware colors
- Smooth transitions without flashing

### Key Highlights
- Pixel-perfect alignment with editor font metrics
- No vertical jump, horizontal shift, or jitter
- Throttled/debounced updates to prevent lag
- Works with all diagnostic sources (Python, C/C++, TypeScript, ESLint, etc.)

## Installation

### From VSIX file
1. Build the extension: `npm run build`
2. Package: `npx vsce package`
3. Install the `.vsix` file in VS Code

### For Development
1. Clone the repository
2. Run `npm install`
3. Press F5 in VS Code to launch Extension Development Host

## Configuration

Access settings via `File > Preferences > Settings` and search for "Inline Diagnostics".

| Setting | Default | Description |
|---------|---------|-------------|
| `inlineDiagnostics.enabled` | `true` | Enable/disable the extension |
| `inlineDiagnostics.compactMode` | `true` | Show compact dot indicators when cursor is not on the diagnostic line |
| `inlineDiagnostics.backgroundOpacity` | `0.15` | Opacity (0-1) for expanded message background |
| `inlineDiagnostics.dotCount` | `3` | Maximum number of dots to show based on diagnostic count |
| `inlineDiagnostics.showIcons` | `true` | Show severity icons in expanded diagnostics |
| `inlineDiagnostics.maxMessageLength` | `200` | Maximum character length for expanded diagnostic messages |
| `inlineDiagnostics.updateDebounce` | `100` | Debounce time in milliseconds for decoration updates |

## Commands

- **Toggle Inline Diagnostics**: Enable/disable the extension
- **Refresh Inline Diagnostics**: Force refresh all decorations

## Architecture

The extension is built with a modular architecture:

- **ConfigurationManager**: Handles user settings and configuration changes
- **DiagnosticManager**: Fetches and groups diagnostics from VS Code
- **DiagnosticAnalyzer**: Normalizes messages and merges multi-diagnostic lines
- **DecorationManager**: Creates and caches decoration types with theme colors
- **InlineHintsManager**: Manages cursor tracking and decoration application

## Building

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode for development
npm run watch

# Lint the code
npm run lint
```

## Requirements

- VS Code 1.80.0 or higher
- Node.js 18+ for building

## License

MIT

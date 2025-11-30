import * as vscode from 'vscode';
import { SeverityStyle } from '../types';

export const SEVERITY_STYLES: { [key: number]: SeverityStyle } = {
    [vscode.DiagnosticSeverity.Error]: {
        themeColor: 'editorError.foreground',
        icon: '$(error)',
        label: 'Error'
    },
    [vscode.DiagnosticSeverity.Warning]: {
        themeColor: 'editorWarning.foreground',
        icon: '$(warning)',
        label: 'Warning'
    },
    [vscode.DiagnosticSeverity.Information]: {
        themeColor: 'editorInfo.foreground',
        icon: '$(info)',
        label: 'Info'
    },
    [vscode.DiagnosticSeverity.Hint]: {
        themeColor: 'editorHint.foreground',
        icon: '$(lightbulb)',
        label: 'Hint'
    }
};

export const SEVERITY_BACKGROUND_COLORS: { [key: number]: string } = {
    [vscode.DiagnosticSeverity.Error]: 'editorError.background',
    [vscode.DiagnosticSeverity.Warning]: 'editorWarning.background',
    [vscode.DiagnosticSeverity.Information]: 'editorInfo.background',
    [vscode.DiagnosticSeverity.Hint]: 'editorHint.background'
};

export const DOT_CHARACTER = '●';
export const SPACE_CHARACTER = ' ';
export const SEPARATOR = ' | ';

export const DEFAULT_CONFIG = {
    enabled: true,
    compactMode: true,
    backgroundOpacity: 0.15,
    dotCount: 3,
    showIcons: true,
    maxMessageLength: 200,
    updateDebounce: 100
};

export const CONFIG_SECTION = 'inlineDiagnostics';

export const DECORATION_MARGIN = '0 0 0 1.5em';
export const DECORATION_PADDING = '0 0.5em';
export const DECORATION_BORDER_RADIUS = '3px';

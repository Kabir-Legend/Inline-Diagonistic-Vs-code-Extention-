import * as vscode from 'vscode';

export enum DiagnosticSeverityLevel {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
}

export interface LineDiagnostic {
    line: number;
    diagnostics: vscode.Diagnostic[];
    highestSeverity: vscode.DiagnosticSeverity;
    messages: string[];
    dotCount: number;
}

export interface LineDiagnosticsMap {
    [lineNumber: number]: LineDiagnostic;
}

export interface DecorationTypeSet {
    compact: vscode.TextEditorDecorationType;
    expanded: vscode.TextEditorDecorationType;
}

export interface DecorationTypeSets {
    [severity: number]: DecorationTypeSet;
}

export interface AppliedDecorations {
    compactRanges: Map<number, vscode.DecorationOptions[]>;
    expandedRanges: Map<number, vscode.DecorationOptions[]>;
}

export interface ExtensionConfiguration {
    enabled: boolean;
    compactMode: boolean;
    dotCount: number;
    showIcons: boolean;
    maxMessageLength: number;
    updateDebounce: number;
}

export interface SeverityStyle {
    themeColor: string;
    icon: string;
    label: string;
}

export interface DecorationCache {
    configHash: string;
    types: DecorationTypeSets;
}

export type DiagnosticUpdateCallback = (lineDiagnostics: LineDiagnosticsMap) => void;
export type CursorChangeCallback = (lineNumber: number) => void;

import * as vscode from 'vscode';
import { LineDiagnosticsMap, LineDiagnostic } from '../types';
import { ConfigurationManager } from './ConfigurationManager';
import { DecorationManager } from './DecorationManager';
import { DiagnosticManager } from './DiagnosticManager';
import { DiagnosticAnalyzer } from './DiagnosticAnalyzer';
import { Debounce } from '../utils/throttle';

interface AppliedDecorationsState {
    expandedLine: number | null;
    compactLines: Set<number>;
    lastHash: string;
}

export class InlineHintsManager implements vscode.Disposable {
    private currentEditor: vscode.TextEditor | undefined;
    private currentCursorLine: number = -1;
    private appliedState: AppliedDecorationsState = {
        expandedLine: null,
        compactLines: new Set(),
        lastHash: ''
    };
    private disposables: vscode.Disposable[] = [];
    private cursorDebounce: Debounce;
    private diagnosticAnalyzer: DiagnosticAnalyzer;
    private lastDiagnosticsMap: LineDiagnosticsMap = {};

    constructor(
        private configManager: ConfigurationManager,
        private decorationManager: DecorationManager,
        private diagnosticManager: DiagnosticManager
    ) {
        this.diagnosticAnalyzer = diagnosticManager.getAnalyzer();
        this.cursorDebounce = new Debounce(50);
        
        this.setupEventListeners();
        this.setupDiagnosticListener();
    }

    private setupEventListeners(): void {
        const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
            if (!this.configManager.isEnabled()) {
                return;
            }

            this.currentEditor = event.textEditor;
            const newCursorLine = event.selections[0]?.active.line ?? -1;

            if (newCursorLine !== this.currentCursorLine) {
                this.currentCursorLine = newCursorLine;
                this.cursorDebounce.execute(() => {
                    this.updateDecorations();
                });
            }
        });

        const activeEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!this.configManager.isEnabled()) {
                return;
            }

            if (this.currentEditor && this.currentEditor !== editor) {
                this.decorationManager.clearAllDecorations(this.currentEditor);
            }

            this.currentEditor = editor;
            this.currentCursorLine = editor?.selection.active.line ?? -1;
            this.appliedState = {
                expandedLine: null,
                compactLines: new Set(),
                lastHash: ''
            };

            if (editor) {
                this.diagnosticManager.refreshAllDiagnostics();
            }
        });

        const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (!this.configManager.isEnabled()) {
                return;
            }

            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && event.document === activeEditor.document) {
                this.currentCursorLine = activeEditor.selection.active.line;
            }
        });

        this.disposables.push(selectionChangeDisposable, activeEditorChangeDisposable, textChangeDisposable);

        this.configManager.onConfigurationChange(() => {
            if (this.configManager.isEnabled()) {
                this.cursorDebounce.immediate(() => {
                    this.updateDecorations();
                });
            } else {
                this.clearAllDecorations();
            }
        });
    }

    private setupDiagnosticListener(): void {
        this.diagnosticManager.onDiagnosticUpdate((lineDiagnosticsMap) => {
            this.lastDiagnosticsMap = lineDiagnosticsMap;
            this.updateDecorations();
        });
    }

    private updateDecorations(): void {
        if (!this.currentEditor || !this.configManager.isEnabled()) {
            return;
        }

        const lineDiagnosticsMap = this.lastDiagnosticsMap;
        const diagnosticsHash = JSON.stringify(lineDiagnosticsMap) + this.currentCursorLine;

        if (diagnosticsHash === this.appliedState.lastHash) {
            return;
        }

        this.appliedState.lastHash = diagnosticsHash;
        this.applyDecorations(lineDiagnosticsMap);
    }

    private applyDecorations(lineDiagnosticsMap: LineDiagnosticsMap): void {
        if (!this.currentEditor) {
            return;
        }

        const editor = this.currentEditor;
        const compactMode = this.configManager.isCompactModeEnabled();

        const compactDecorationsByType: Map<vscode.DiagnosticSeverity, vscode.DecorationOptions[]> = new Map();
        const expandedDecorationsByType: Map<vscode.DiagnosticSeverity, vscode.DecorationOptions[]> = new Map();

        const severities = [
            vscode.DiagnosticSeverity.Error,
            vscode.DiagnosticSeverity.Warning,
            vscode.DiagnosticSeverity.Information,
            vscode.DiagnosticSeverity.Hint
        ];

        for (const severity of severities) {
            compactDecorationsByType.set(severity, []);
            expandedDecorationsByType.set(severity, []);
        }

        for (const lineNumberStr in lineDiagnosticsMap) {
            const lineNumber = parseInt(lineNumberStr, 10);
            const lineDiagnostic = lineDiagnosticsMap[lineNumber];
            const severity = lineDiagnostic.highestSeverity;

            const line = editor.document.lineAt(lineNumber);
            const lineEndPosition = line.range.end;
            const range = new vscode.Range(lineEndPosition, lineEndPosition);

            if (lineNumber === this.currentCursorLine) {
                const message = this.diagnosticAnalyzer.getFormattedExpandedMessage(lineDiagnostic);
                const decorationOptions = this.decorationManager.createExpandedDecorationOptions(
                    range,
                    ` ${message}`,
                    severity
                );
                expandedDecorationsByType.get(severity)!.push(decorationOptions);
            } else if (compactMode) {
                const indicator = this.diagnosticAnalyzer.getCompactIndicator(lineDiagnostic);
                const decorationOptions = this.decorationManager.createCompactDecorationOptions(
                    range,
                    ` ${indicator}`,
                    severity
                );
                compactDecorationsByType.get(severity)!.push(decorationOptions);
            }
        }

        for (const severity of severities) {
            const compactType = this.decorationManager.getCompactDecorationType(severity);
            const expandedType = this.decorationManager.getExpandedDecorationType(severity);

            editor.setDecorations(compactType, compactDecorationsByType.get(severity)!);
            editor.setDecorations(expandedType, expandedDecorationsByType.get(severity)!);
        }

        this.appliedState.expandedLine = this.currentCursorLine;
        this.appliedState.compactLines = new Set(
            Object.keys(lineDiagnosticsMap)
                .map(k => parseInt(k, 10))
                .filter(line => line !== this.currentCursorLine)
        );
    }

    private clearAllDecorations(): void {
        if (this.currentEditor) {
            this.decorationManager.clearAllDecorations(this.currentEditor);
        }
        this.appliedState = {
            expandedLine: null,
            compactLines: new Set(),
            lastHash: ''
        };
    }

    public refresh(): void {
        this.appliedState.lastHash = '';
        this.diagnosticManager.refreshAllDiagnostics();
    }

    public initialize(): void {
        this.currentEditor = vscode.window.activeTextEditor;
        if (this.currentEditor) {
            this.currentCursorLine = this.currentEditor.selection.active.line;
            this.diagnosticManager.refreshAllDiagnostics();
        }
    }

    public dispose(): void {
        this.cursorDebounce.dispose();
        this.clearAllDecorations();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}

import * as vscode from 'vscode';
import { LineDiagnosticsMap, DiagnosticUpdateCallback } from '../types';
import { DiagnosticAnalyzer } from './DiagnosticAnalyzer';
import { ConfigurationManager } from './ConfigurationManager';
import { Debounce } from '../utils/throttle';

export class DiagnosticManager implements vscode.Disposable {
    private diagnosticsMap: Map<string, LineDiagnosticsMap> = new Map();
    private updateCallbacks: DiagnosticUpdateCallback[] = [];
    private disposables: vscode.Disposable[] = [];
    private updateDebounce: Debounce;
    private diagnosticAnalyzer: DiagnosticAnalyzer;

    constructor(private configManager: ConfigurationManager) {
        this.diagnosticAnalyzer = new DiagnosticAnalyzer(configManager);
        this.updateDebounce = new Debounce(configManager.getUpdateDebounce());
        
        this.setupDiagnosticListener();
        this.setupConfigurationListener();
    }

    private setupDiagnosticListener(): void {
        const diagnosticChangeDisposable = vscode.languages.onDidChangeDiagnostics((event) => {
            for (const uri of event.uris) {
                this.processDiagnosticsForUri(uri);
            }
        });

        this.disposables.push(diagnosticChangeDisposable);
    }

    private setupConfigurationListener(): void {
        this.configManager.onConfigurationChange((config) => {
            this.updateDebounce.setDelay(config.updateDebounce);
            this.refreshAllDiagnostics();
        });
    }

    private processDiagnosticsForUri(uri: vscode.Uri): void {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        const lineDiagnosticsMap = this.diagnosticAnalyzer.analyzeDiagnostics(diagnostics);
        
        this.diagnosticsMap.set(uri.toString(), lineDiagnosticsMap);

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.toString() === uri.toString()) {
            this.updateDebounce.execute(() => {
                this.notifyUpdate(lineDiagnosticsMap);
            });
        }
    }

    public refreshAllDiagnostics(): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const uri = activeEditor.document.uri;
        const diagnostics = vscode.languages.getDiagnostics(uri);
        const lineDiagnosticsMap = this.diagnosticAnalyzer.analyzeDiagnostics(diagnostics);
        
        this.diagnosticsMap.set(uri.toString(), lineDiagnosticsMap);
        this.notifyUpdate(lineDiagnosticsMap);
    }

    public getDiagnosticsForUri(uri: vscode.Uri): LineDiagnosticsMap {
        return this.diagnosticsMap.get(uri.toString()) || {};
    }

    public getDiagnosticsForLine(uri: vscode.Uri, lineNumber: number): LineDiagnosticsMap[number] | undefined {
        const lineDiagnosticsMap = this.getDiagnosticsForUri(uri);
        return lineDiagnosticsMap[lineNumber];
    }

    public onDiagnosticUpdate(callback: DiagnosticUpdateCallback): void {
        this.updateCallbacks.push(callback);
    }

    private notifyUpdate(lineDiagnosticsMap: LineDiagnosticsMap): void {
        for (const callback of this.updateCallbacks) {
            callback(lineDiagnosticsMap);
        }
    }

    public getAnalyzer(): DiagnosticAnalyzer {
        return this.diagnosticAnalyzer;
    }

    public clearDiagnosticsForUri(uri: vscode.Uri): void {
        this.diagnosticsMap.delete(uri.toString());
    }

    public dispose(): void {
        this.updateDebounce.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.updateCallbacks = [];
        this.diagnosticsMap.clear();
    }
}

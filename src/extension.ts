import * as vscode from 'vscode';
import {
    ConfigurationManager,
    DecorationManager,
    DiagnosticManager,
    InlineHintsManager
} from './managers';

let configurationManager: ConfigurationManager | undefined;
let decorationManager: DecorationManager | undefined;
let diagnosticManager: DiagnosticManager | undefined;
let inlineHintsManager: InlineHintsManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
    console.log('Inline Diagnostics extension is now active');

    configurationManager = new ConfigurationManager();
    decorationManager = new DecorationManager(configurationManager);
    diagnosticManager = new DiagnosticManager(configurationManager);
    inlineHintsManager = new InlineHintsManager(
        configurationManager,
        decorationManager,
        diagnosticManager
    );

    const toggleCommand = vscode.commands.registerCommand('inlineDiagnostics.toggle', async () => {
        if (configurationManager) {
            const currentState = configurationManager.isEnabled();
            await configurationManager.setEnabled(!currentState);
            
            const newState = !currentState ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`Inline Diagnostics ${newState}`);
        }
    });

    const refreshCommand = vscode.commands.registerCommand('inlineDiagnostics.refresh', () => {
        if (inlineHintsManager) {
            inlineHintsManager.refresh();
            vscode.window.showInformationMessage('Inline Diagnostics refreshed');
        }
    });

    context.subscriptions.push(
        toggleCommand,
        refreshCommand,
        configurationManager,
        decorationManager,
        diagnosticManager,
        inlineHintsManager
    );

    inlineHintsManager.initialize();
}

export function deactivate(): void {
    console.log('Inline Diagnostics extension is now deactivated');
    
    if (inlineHintsManager) {
        inlineHintsManager.dispose();
        inlineHintsManager = undefined;
    }
    
    if (diagnosticManager) {
        diagnosticManager.dispose();
        diagnosticManager = undefined;
    }
    
    if (decorationManager) {
        decorationManager.dispose();
        decorationManager = undefined;
    }
    
    if (configurationManager) {
        configurationManager.dispose();
        configurationManager = undefined;
    }
}

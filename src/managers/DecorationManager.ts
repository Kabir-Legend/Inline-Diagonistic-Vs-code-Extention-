import * as vscode from 'vscode';
import { DecorationTypeSet, DecorationTypeSets, DecorationCache } from '../types';
import { ConfigurationManager } from './ConfigurationManager';
import { SEVERITY_STYLES, DECORATION_MARGIN, DECORATION_PADDING, DECORATION_BORDER_RADIUS } from '../constants';

export class DecorationManager implements vscode.Disposable {
    private decorationCache: DecorationCache | null = null;
    private disposables: vscode.Disposable[] = [];

    constructor(private configManager: ConfigurationManager) {
        this.initializeDecorationTypes();
        this.configManager.onConfigurationChange(() => {
            this.refreshDecorationTypes();
        });
    }

    private initializeDecorationTypes(): void {
        const configHash = this.configManager.getConfigHash();
        
        if (this.decorationCache && this.decorationCache.configHash === configHash) {
            return;
        }

        this.disposeDecorationTypes();
        
        const types: DecorationTypeSets = {};
        const severities = [
            vscode.DiagnosticSeverity.Error,
            vscode.DiagnosticSeverity.Warning,
            vscode.DiagnosticSeverity.Information,
            vscode.DiagnosticSeverity.Hint
        ];

        for (const severity of severities) {
            types[severity] = this.createDecorationTypeSet(severity);
        }

        this.decorationCache = {
            configHash,
            types
        };
    }

    private createDecorationTypeSet(severity: vscode.DiagnosticSeverity): DecorationTypeSet {
        const style = SEVERITY_STYLES[severity];
        const opacity = this.configManager.getBackgroundOpacity();

        const compactDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: DECORATION_MARGIN,
                textDecoration: 'none; white-space: pre;'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        const expandedDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: DECORATION_MARGIN,
                textDecoration: `none; white-space: pre; padding: ${DECORATION_PADDING}; border-radius: ${DECORATION_BORDER_RADIUS};`
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        return {
            compact: compactDecorationType,
            expanded: expandedDecorationType
        };
    }

    private refreshDecorationTypes(): void {
        this.initializeDecorationTypes();
    }

    private disposeDecorationTypes(): void {
        if (this.decorationCache) {
            for (const severity in this.decorationCache.types) {
                const typeSet = this.decorationCache.types[severity];
                typeSet.compact.dispose();
                typeSet.expanded.dispose();
            }
            this.decorationCache = null;
        }
    }

    public getDecorationTypes(): DecorationTypeSets {
        if (!this.decorationCache) {
            this.initializeDecorationTypes();
        }
        return this.decorationCache!.types;
    }

    public getCompactDecorationType(severity: vscode.DiagnosticSeverity): vscode.TextEditorDecorationType {
        const types = this.getDecorationTypes();
        return types[severity]?.compact || types[vscode.DiagnosticSeverity.Error].compact;
    }

    public getExpandedDecorationType(severity: vscode.DiagnosticSeverity): vscode.TextEditorDecorationType {
        const types = this.getDecorationTypes();
        return types[severity]?.expanded || types[vscode.DiagnosticSeverity.Error].expanded;
    }

    public createCompactDecorationOptions(
        range: vscode.Range,
        content: string,
        severity: vscode.DiagnosticSeverity
    ): vscode.DecorationOptions {
        const style = SEVERITY_STYLES[severity];
        
        return {
            range,
            renderOptions: {
                after: {
                    contentText: content,
                    color: new vscode.ThemeColor(style.themeColor),
                    fontStyle: 'normal',
                    fontWeight: 'normal'
                }
            }
        };
    }

    public createExpandedDecorationOptions(
        range: vscode.Range,
        content: string,
        severity: vscode.DiagnosticSeverity
    ): vscode.DecorationOptions {
        const style = SEVERITY_STYLES[severity];
        const opacity = this.configManager.getBackgroundOpacity();
        
        return {
            range,
            renderOptions: {
                after: {
                    contentText: content,
                    color: new vscode.ThemeColor(style.themeColor),
                    backgroundColor: new vscode.ThemeColor(`${style.themeColor}`),
                    fontStyle: 'normal',
                    fontWeight: 'normal'
                }
            }
        };
    }

    public clearAllDecorations(editor: vscode.TextEditor): void {
        if (!this.decorationCache) {
            return;
        }

        for (const severity in this.decorationCache.types) {
            const typeSet = this.decorationCache.types[severity];
            editor.setDecorations(typeSet.compact, []);
            editor.setDecorations(typeSet.expanded, []);
        }
    }

    public dispose(): void {
        this.disposeDecorationTypes();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}

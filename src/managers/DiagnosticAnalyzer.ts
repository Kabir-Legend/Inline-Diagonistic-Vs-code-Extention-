import * as vscode from 'vscode';
import { LineDiagnostic, LineDiagnosticsMap } from '../types';
import { ConfigurationManager } from './ConfigurationManager';

export class DiagnosticAnalyzer {
    constructor(private configManager: ConfigurationManager) {}

    public analyzeDiagnostics(diagnostics: vscode.Diagnostic[]): LineDiagnosticsMap {
        const lineDiagnosticsMap: LineDiagnosticsMap = {};

        for (const diagnostic of diagnostics) {
            const lineNumber = diagnostic.range.start.line;

            if (!lineDiagnosticsMap[lineNumber]) {
                lineDiagnosticsMap[lineNumber] = {
                    line: lineNumber,
                    diagnostics: [],
                    highestSeverity: vscode.DiagnosticSeverity.Hint,
                    messages: [],
                    dotCount: 0
                };
            }

            const lineDiagnostic = lineDiagnosticsMap[lineNumber];
            lineDiagnostic.diagnostics.push(diagnostic);

            if (diagnostic.severity !== undefined && diagnostic.severity < lineDiagnostic.highestSeverity) {
                lineDiagnostic.highestSeverity = diagnostic.severity;
            }

            const normalizedMessage = this.normalizeMessage(diagnostic.message);
            if (!lineDiagnostic.messages.includes(normalizedMessage)) {
                lineDiagnostic.messages.push(normalizedMessage);
            }
        }

        for (const lineNumber in lineDiagnosticsMap) {
            const lineDiagnostic = lineDiagnosticsMap[lineNumber];
            lineDiagnostic.dotCount = this.calculateDotCount(lineDiagnostic.diagnostics.length);
            lineDiagnostic.diagnostics.sort((a, b) => (a.severity ?? 3) - (b.severity ?? 3));
            lineDiagnostic.messages = this.sortMessagesBySeverity(lineDiagnostic);
        }

        return lineDiagnosticsMap;
    }

    private normalizeMessage(message: string): string {
        let normalized = message.trim();
        normalized = normalized.replace(/\s+/g, ' ');
        normalized = normalized.replace(/\n/g, ' ');
        
        const maxLength = this.configManager.getMaxMessageLength();
        if (normalized.length > maxLength) {
            normalized = normalized.substring(0, maxLength - 3) + '...';
        }

        return normalized;
    }

    private calculateDotCount(diagnosticCount: number): number {
        const maxDots = this.configManager.getMaxDotCount();
        return Math.min(diagnosticCount, maxDots);
    }

    private sortMessagesBySeverity(lineDiagnostic: LineDiagnostic): string[] {
        const sortedDiagnostics = [...lineDiagnostic.diagnostics].sort(
            (a, b) => (a.severity ?? 3) - (b.severity ?? 3)
        );

        const sortedMessages: string[] = [];
        const seenMessages = new Set<string>();

        for (const diagnostic of sortedDiagnostics) {
            const message = this.normalizeMessage(diagnostic.message);
            if (!seenMessages.has(message)) {
                seenMessages.add(message);
                sortedMessages.push(message);
            }
        }

        return sortedMessages;
    }

    public getMergedMessage(lineDiagnostic: LineDiagnostic): string {
        const showIcons = this.configManager.shouldShowIcons();
        const messages = lineDiagnostic.messages;

        if (messages.length === 1) {
            return messages[0];
        }

        const maxLength = this.configManager.getMaxMessageLength();
        let mergedMessage = messages.join(' | ');

        if (mergedMessage.length > maxLength) {
            const firstMessage = messages[0];
            const additionalCount = messages.length - 1;
            mergedMessage = `${firstMessage} (+${additionalCount} more)`;

            if (mergedMessage.length > maxLength) {
                mergedMessage = mergedMessage.substring(0, maxLength - 3) + '...';
            }
        }

        return mergedMessage;
    }

    public getCompactIndicator(lineDiagnostic: LineDiagnostic): string {
        const dotCount = lineDiagnostic.dotCount;
        const dots = '●'.repeat(dotCount);
        
        const diagnosticCount = lineDiagnostic.diagnostics.length;
        if (diagnosticCount > this.configManager.getMaxDotCount()) {
            return `${dots} +${diagnosticCount - dotCount}`;
        }

        return dots;
    }

    public getSeverityIcon(severity: vscode.DiagnosticSeverity): string {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return '✖';
            case vscode.DiagnosticSeverity.Warning:
                return '⚠';
            case vscode.DiagnosticSeverity.Information:
                return 'ℹ';
            case vscode.DiagnosticSeverity.Hint:
                return '💡';
            default:
                return '●';
        }
    }

    public getFormattedExpandedMessage(lineDiagnostic: LineDiagnostic): string {
        const showIcons = this.configManager.shouldShowIcons();
        const icon = showIcons ? this.getSeverityIcon(lineDiagnostic.highestSeverity) : '';
        const message = this.getMergedMessage(lineDiagnostic);
        
        if (showIcons) {
            return `${icon} ${message}`;
        }
        
        return message;
    }
}

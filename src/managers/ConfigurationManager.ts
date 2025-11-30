import * as vscode from 'vscode';
import { ExtensionConfiguration } from '../types';
import { CONFIG_SECTION, DEFAULT_CONFIG } from '../constants';

export class ConfigurationManager implements vscode.Disposable {
    private config: ExtensionConfiguration;
    private configHash: string;
    private disposables: vscode.Disposable[] = [];
    private onConfigChangeCallbacks: ((config: ExtensionConfiguration) => void)[] = [];

    constructor() {
        this.config = this.loadConfiguration();
        this.configHash = this.calculateHash(this.config);
        this.setupConfigurationListener();
    }

    private loadConfiguration(): ExtensionConfiguration {
        const workspaceConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
        
        return {
            enabled: workspaceConfig.get<boolean>('enabled', DEFAULT_CONFIG.enabled),
            compactMode: workspaceConfig.get<boolean>('compactMode', DEFAULT_CONFIG.compactMode),
            backgroundOpacity: workspaceConfig.get<number>('backgroundOpacity', DEFAULT_CONFIG.backgroundOpacity),
            dotCount: workspaceConfig.get<number>('dotCount', DEFAULT_CONFIG.dotCount),
            showIcons: workspaceConfig.get<boolean>('showIcons', DEFAULT_CONFIG.showIcons),
            maxMessageLength: workspaceConfig.get<number>('maxMessageLength', DEFAULT_CONFIG.maxMessageLength),
            updateDebounce: workspaceConfig.get<number>('updateDebounce', DEFAULT_CONFIG.updateDebounce)
        };
    }

    private calculateHash(config: ExtensionConfiguration): string {
        return JSON.stringify(config);
    }

    private setupConfigurationListener(): void {
        const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(CONFIG_SECTION)) {
                const newConfig = this.loadConfiguration();
                const newHash = this.calculateHash(newConfig);

                if (newHash !== this.configHash) {
                    this.config = newConfig;
                    this.configHash = newHash;
                    this.notifyConfigChange();
                }
            }
        });

        this.disposables.push(disposable);
    }

    private notifyConfigChange(): void {
        for (const callback of this.onConfigChangeCallbacks) {
            callback(this.config);
        }
    }

    public getConfiguration(): ExtensionConfiguration {
        return { ...this.config };
    }

    public getConfigHash(): string {
        return this.configHash;
    }

    public isEnabled(): boolean {
        return this.config.enabled;
    }

    public isCompactModeEnabled(): boolean {
        return this.config.compactMode;
    }

    public getBackgroundOpacity(): number {
        return this.config.backgroundOpacity;
    }

    public getMaxDotCount(): number {
        return this.config.dotCount;
    }

    public shouldShowIcons(): boolean {
        return this.config.showIcons;
    }

    public getMaxMessageLength(): number {
        return this.config.maxMessageLength;
    }

    public getUpdateDebounce(): number {
        return this.config.updateDebounce;
    }

    public onConfigurationChange(callback: (config: ExtensionConfiguration) => void): void {
        this.onConfigChangeCallbacks.push(callback);
    }

    public async setEnabled(enabled: boolean): Promise<void> {
        const workspaceConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
        await workspaceConfig.update('enabled', enabled, vscode.ConfigurationTarget.Global);
    }

    public dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.onConfigChangeCallbacks = [];
    }
}

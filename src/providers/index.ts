import * as vscode from 'vscode';

export interface DatabaseProvider {
    type: string;
    connect(connection: any): Promise<any>;
    disconnect(client: any): Promise<void>;
    getTreeItems(client: any): Promise<vscode.TreeItem[]>;
    createQueryPanel(
        context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        connection: any,
        client: any,
        connectionsProvider: any
    ): void;
    // For TreeView metadata retrieval
    getMetadata?(client: any): Promise<any>;
}

export class ProviderRegistry {
    private static providers: Map<string, DatabaseProvider> = new Map();

    static register(provider: DatabaseProvider) {
        this.providers.set(provider.type, provider);
    }

    static getProvider(type: string): DatabaseProvider | undefined {
        return this.providers.get(type) || this.providers.get('postgres'); // Default to postgres for backward compatibility
    }

    static getAllProviders(): DatabaseProvider[] {
        return Array.from(this.providers.values());
    }
}

import * as vscode from 'vscode';

export interface BaseConfig {
    id: string;
    label: string;
    host: string;
    port: string | number;
}

export interface PostgresConfig extends BaseConfig {
    type: 'postgres';
    user: string;
    password?: string;
    database: string;
}

export interface RedisConfig extends BaseConfig {
    type: 'redis';
    password?: string;
}

export type ConnectionConfig = PostgresConfig | RedisConfig;

export interface Bookmark {
    id: string;
    connectionLabel: string;
    name: string;
    query: string;
}

export interface PostgresMetadata {
    type: 'postgres';
    tables: string[];
}

export interface RedisMetadata {
    type: 'redis';
}

export type ConnectionMetadata = PostgresMetadata | RedisMetadata;

export interface DatabaseProvider {
    type: string;
    connect(connection: ConnectionConfig): Promise<any>;
    disconnect(client: any): Promise<void>;
    getTreeItems(client: any): Promise<vscode.TreeItem[]>;
    createQueryPanel(
        context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        connection: ConnectionConfig,
        client: any,
        connectionsProvider: any,
        initialQuery?: string
    ): void;
    // For TreeView metadata retrieval
    getMetadata?(client: any): Promise<ConnectionMetadata>;
    getFolders(connectionLabel: string): vscode.TreeItem[];
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

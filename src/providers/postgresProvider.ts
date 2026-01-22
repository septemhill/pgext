import * as vscode from 'vscode';
import { Client, FieldDef } from 'pg';
import { DatabaseProvider, ConnectionConfig, PostgresConfig, PostgresMetadata } from './index';
import { createQueryWebviewPanel } from '../pgQueryWebview';

export class PostgresProvider implements DatabaseProvider {
    type = 'postgres';

    async connect(connection: ConnectionConfig): Promise<Client> {
        const pgConfig = connection as PostgresConfig;
        const client = new Client({
            host: pgConfig.host,
            port: typeof pgConfig.port === 'string' ? parseInt(pgConfig.port, 10) : pgConfig.port,
            user: pgConfig.user,
            password: pgConfig.password,
            database: pgConfig.database,
            connectionTimeoutMillis: 5000
        });
        await client.connect();
        return client;
    }

    async disconnect(client: Client): Promise<void> {
        await client.end();
    }

    async getTreeItems(client: Client): Promise<vscode.TreeItem[]> {
        const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
        const tables = tablesResult.rows.map(row => row.table_name);

        const tablesItem = new vscode.TreeItem('Tables', vscode.TreeItemCollapsibleState.Collapsed);
        tablesItem.contextValue = 'tablesFolder';
        tablesItem.iconPath = new vscode.ThemeIcon('folder');

        // We need a way to store these tables for the TreeDataProvider to access them.
        // In the original code, they were passed to connectionsProvider.setActive.
        // Let's return them as a list of TreeItems that will be children of the connection.
        return [tablesItem];
    }

    async getMetadata(client: Client): Promise<PostgresMetadata> {
        const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
        return {
            type: 'postgres',
            tables: tablesResult.rows.map(row => row.table_name)
        };
    }

    createQueryPanel(
        context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        connection: ConnectionConfig,
        client: any,
        connectionsProvider: any,
        initialQuery?: string
    ): void {
        createQueryWebviewPanel(context, outputChannel, connection, client, connectionsProvider, initialQuery);
    }

    getFolders(connectionLabel: string): vscode.TreeItem[] {
        const folderItems = [];
        const tablesItem = new vscode.TreeItem('Tables', vscode.TreeItemCollapsibleState.Collapsed);
        tablesItem.contextValue = 'tablesFolder';
        tablesItem.description = connectionLabel;
        tablesItem.iconPath = new vscode.ThemeIcon('folder');
        folderItems.push(tablesItem);

        const bookmarksItem = new vscode.TreeItem('Bookmarks', vscode.TreeItemCollapsibleState.Collapsed);
        bookmarksItem.contextValue = 'bookmarksFolder';
        bookmarksItem.description = connectionLabel;
        bookmarksItem.iconPath = new vscode.ThemeIcon('bookmark');
        folderItems.push(bookmarksItem);

        return folderItems;
    }
}

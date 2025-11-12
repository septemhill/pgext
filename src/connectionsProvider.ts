import * as vscode from 'vscode';
import { Client } from 'pg';
import { RedisClientType } from 'redis';

export interface ActiveConnection {
    client: Client | RedisClientType;
    tables: string[];
}

export class ConnectionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private activeConnections: Map<string, ActiveConnection> = new Map();

    constructor(private context: vscode.ExtensionContext) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    setActive(connectionLabel: string, client: Client | RedisClientType, tables: string[]): void {
        this.activeConnections.set(connectionLabel, { client, tables });
        this.refresh();
    }

    setInactive(connectionLabel: string): void {
        if (this.activeConnections.has(connectionLabel)) {
            this.activeConnections.delete(connectionLabel);
            this.refresh();
        }
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            if (element.contextValue === 'connectionItem') {
                // The alias is stored in the description property for postgres, and label for redis
                const connectionLabel = element.description as string;
                if (this.activeConnections.has(connectionLabel)) {
                    const tablesItem = new vscode.TreeItem('Tables', vscode.TreeItemCollapsibleState.Collapsed);
                    tablesItem.contextValue = 'tablesFolder';
                    // Pass the connection label to the tablesFolder item
                    tablesItem.description = connectionLabel;
                    tablesItem.iconPath = new vscode.ThemeIcon('folder');
                    return Promise.resolve([tablesItem]);
                }
            }

            if (element.contextValue === 'tablesFolder') {
                const connectionLabel = element.description as string; // The alias is stored in the description
                const activeConnection = this.activeConnections.get(connectionLabel);
                if (activeConnection) {
                    return Promise.resolve(activeConnection.tables.map(table => {
                        const item = new vscode.TreeItem(table);
                        item.iconPath = new vscode.ThemeIcon('symbol-struct');
                        item.collapsibleState = vscode.TreeItemCollapsibleState.None;
                        item.contextValue = 'tableItem';
                        return item;
                    }));
                }
            }
            return Promise.resolve([]);
        } else {
            const connections = this.context.globalState.get<any[]>('postgres.connections') || [];
            if (connections.length === 0) {
                return Promise.resolve([]);
            }

            const connectionItems = connections.map(conn => {
                const alias = conn.alias || `${conn.user}@${conn.host}`;
                const label = `${alias} (${conn.dbType || 'Postgres'})`;
                const item = new vscode.TreeItem(label); // The label displayed in the tree view
                const isActive = this.activeConnections.has(alias);

                item.collapsibleState = isActive ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.tooltip = `${conn.user}@${conn.host}:${conn.port}/${conn.database}`;
                item.description = alias; // Store the alias in the description for later retrieval
                item.iconPath = new vscode.ThemeIcon(isActive ? 'database' : 'debug-disconnect');
                item.contextValue = 'connectionItem';
                return item;
            });

            return Promise.resolve(connectionItems);
        }
    }
}
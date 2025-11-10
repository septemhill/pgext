import * as vscode from 'vscode';
import { Client } from 'pg';

export interface ActiveConnection {
    client: Client;
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

    setActive(connectionLabel: string, client: Client, tables: string[]): void {
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
                const connectionLabel = element.label as string;
                if (this.activeConnections.has(connectionLabel)) {
                    const tablesItem = new vscode.TreeItem('Tables', vscode.TreeItemCollapsibleState.Collapsed);
                    tablesItem.contextValue = 'tablesFolder';
                    // Store connection label in a custom property or use description
                    tablesItem.description = connectionLabel;
                    tablesItem.iconPath = new vscode.ThemeIcon('folder');
                    return Promise.resolve([tablesItem]);
                }
            }

            if (element.contextValue === 'tablesFolder') {
                const connectionLabel = element.description as string;
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
                const label = conn.alias || `${conn.user}@${conn.host}`;
                const item = new vscode.TreeItem(label);
                const isActive = this.activeConnections.has(label);

                item.collapsibleState = isActive ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.tooltip = `${conn.user}@${conn.host}:${conn.port}/${conn.database}`;
                item.iconPath = new vscode.ThemeIcon(isActive ? 'database' : 'debug-disconnect');
                item.contextValue = 'connectionItem';
                return item;
            });

            return Promise.resolve(connectionItems);
        }
    }
}
import * as vscode from 'vscode';

export interface ActiveConnection {
    client: any;
    metadata: any;
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

    setActive(connectionLabel: string, client: any, metadata: any): void {
        this.activeConnections.set(connectionLabel, { client, metadata });
        this.refresh();
    }

    setInactive(connectionLabel: string): void {
        if (this.activeConnections.has(connectionLabel)) {
            this.activeConnections.delete(connectionLabel);
            this.refresh();
        }
    }

    getActiveConnection(connectionLabel: string): ActiveConnection | undefined {
        return this.activeConnections.get(connectionLabel);
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            if (element.contextValue === 'connectionItem') {
                const connectionLabel = element.description as string;
                const activeConnection = this.activeConnections.get(connectionLabel);
                if (activeConnection && activeConnection.metadata && activeConnection.metadata.tables) {
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

                    return Promise.resolve(folderItems);
                }
            }

            if (element.contextValue === 'bookmarksFolder') {
                const connectionLabel = element.description as string;
                const bookmarksKey = `bookmarks.${connectionLabel}`;
                const bookmarks = this.context.globalState.get<any[]>(bookmarksKey) || [];
                return Promise.resolve(bookmarks.map(bookmark => {
                    const item = new vscode.TreeItem(bookmark.name);
                    item.iconPath = new vscode.ThemeIcon('code');
                    item.collapsibleState = vscode.TreeItemCollapsibleState.None;
                    item.contextValue = 'bookmarkItem';
                    item.description = bookmark.query;
                    item.tooltip = bookmark.query;
                    item.command = {
                        command: 'db-extension.openBookmark',
                        title: 'Open Bookmark',
                        arguments: [bookmark, connectionLabel]
                    };
                    return item;
                }));
            }

            if (element.contextValue === 'tablesFolder') {
                const connectionLabel = element.description as string;
                const activeConnection = this.activeConnections.get(connectionLabel);
                if (activeConnection && activeConnection.metadata && activeConnection.metadata.tables) {
                    return Promise.resolve(activeConnection.metadata.tables.map((table: string) => {
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
                const dbType = conn.dbType || 'Postgres';
                const label = `${alias} (${dbType.charAt(0).toUpperCase() + dbType.slice(1)})`;
                const item = new vscode.TreeItem(label);
                const isActive = this.activeConnections.has(alias);

                item.collapsibleState = isActive ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.tooltip = `${conn.user}@${conn.host}:${conn.port}/${conn.database || ''}`;
                item.description = alias;
                item.iconPath = new vscode.ThemeIcon(isActive ? 'database' : 'debug-disconnect');
                item.contextValue = 'connectionItem';
                return item;
            });

            return Promise.resolve(connectionItems);
        }
    }
}
import * as vscode from 'vscode';

export class ConnectionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            // We don't have nested items for now
            return Promise.resolve([]);
        } else {
            const connections = this.context.globalState.get<any[]>('postgres.connections') || [];
            if (connections.length === 0) {
                return Promise.resolve([]);
            }

            const connectionItems = connections.map(conn => {
                const item = new vscode.TreeItem(conn.alias || `${conn.user}@${conn.host}`);
                item.collapsibleState = vscode.TreeItemCollapsibleState.None;
                item.tooltip = `${conn.user}@${conn.host}:${conn.port}/${conn.database}`;
                item.iconPath = new vscode.ThemeIcon('database');
                return item;
            });

            return Promise.resolve(connectionItems);
        }
    }
}
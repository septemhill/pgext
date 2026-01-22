import * as vscode from 'vscode';
import { ConnectionsProvider } from './connectionsProvider';
import { RedisClientType } from 'redis';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getRedisWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, initialQuery?: string): string {
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redis Query</title>
            <script nonce="${nonce}">
                window.view = 'redisQuery';
                window.initialQuery = ${JSON.stringify(initialQuery || '')};
            </script>
        </head>
        <body><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body>
        </html>`;
}

export function createRedisQueryWebviewPanel(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    connection: any,
    client: RedisClientType,
    connectionsProvider: ConnectionsProvider,
    initialQuery?: string
) {
    const panel = vscode.window.createWebviewPanel(
        'redisQuery',
        `Query: ${connection.alias || `${connection.user}@${connection.host}`}`,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getRedisWebviewContent(context, panel, initialQuery);

    panel.webview.onDidReceiveMessage(
        async message => {
            if (message.command === 'executeRedisCommand') {
                try {
                    // Split command into arguments. Assumes simple space separation.
                    const args = message.redisCommand.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((arg: string) => arg.replace(/"/g, '')) || [];
                    if (args.length === 0) {
                        return;
                    }
                    const result = await client.sendCommand(args);
                    panel.webview.postMessage({ command: 'queryResult', result });
                } catch (error: any) {
                    outputChannel.appendLine(`Redis Command Error: ${error.message}`);
                    panel.webview.postMessage({ command: 'queryError', error: error.message });
                }
            } else if (message.command === 'saveQuery') {
                const connectionLabel = connection.alias || `${connection.user}@${connection.host}`;
                const bookmarksKey = `bookmarks.${connectionLabel}`;
                const bookmarks = context.globalState.get<any[]>(bookmarksKey) || [];

                const name = await vscode.window.showInputBox({
                    prompt: 'Enter a name for this bookmark',
                    placeHolder: 'e.g. Get User Cache',
                    validateInput: (value: string) => {
                        if (!value.trim()) {
                            return 'Name cannot be empty';
                        }
                        if (bookmarks.some(b => b.name === value.trim())) {
                            return `Bookmark with name "${value.trim()}" already exists.`;
                        }
                        return null;
                    }
                });

                if (name) {
                    bookmarks.push({
                        id: Date.now().toString(),
                        connectionLabel,
                        name: name.trim(),
                        query: message.query
                    });

                    await context.globalState.update(bookmarksKey, bookmarks);
                    vscode.window.showInformationMessage(`Bookmark "${name.trim()}" saved successfully.`);
                    connectionsProvider.refresh();
                }
            }
        },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(
        async () => {
            await client.quit();
            outputChannel.appendLine(`Disconnected from Redis: ${connection.alias || `${connection.user}@${connection.host}`}.`);
            connectionsProvider.setInactive(connection.alias || `${connection.user}@${connection.host}`);
        },
        null,
        context.subscriptions
    );
}
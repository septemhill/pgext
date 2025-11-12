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

export function getRedisWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redis Query</title>
            <script nonce="${nonce}">window.view = 'redisQuery';</script>
        </head>
        <body><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body>
        </html>`;
}

export function createRedisQueryWebviewPanel(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    connection: any,
    client: RedisClientType,
    connectionsProvider: ConnectionsProvider
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

    panel.webview.html = getRedisWebviewContent(context, panel);

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
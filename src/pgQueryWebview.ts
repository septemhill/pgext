import * as vscode from 'vscode';
import * as path from 'path';
import { Client, FieldDef } from 'pg';
import { ConnectionsProvider } from './connectionsProvider';

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getSQLWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js'));
	const nonce = getNonce();

	return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>SQL Query</title>
			<script nonce="${nonce}">window.view = 'sqlQuery';</script>
		</head>
		<body><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body>
		</html>`;
}

export function createQueryWebviewPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connection: any, client: Client, connectionsProvider: ConnectionsProvider) {
	const panel = vscode.window.createWebviewPanel(
		'sqlQuery',
		`Query: ${connection.alias || `${connection.user}@${connection.host}`}`,
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	panel.webview.html = getSQLWebviewContent(context, panel);

	panel.webview.onDidReceiveMessage(
		async message => {
			if (message.command === 'executeQuery') {
				try {
					const result = await client.query(message.sql);
					panel.webview.postMessage({
						command: 'queryResult',
						result: {
							rows: result.rows,
							fields: result.fields.map((field: FieldDef) => field.name)
						}
					});
				} catch (error: any) {
					outputChannel.appendLine(`SQL Query Error: ${error.message}`);
					panel.webview.postMessage({ command: 'queryError', error: error.message });
				}
			}
		},
		undefined,
		context.subscriptions
	);

	panel.onDidDispose(
		async () => {
			await client.end();
			outputChannel.appendLine(`Disconnected from ${connection.alias || `${connection.user}@${connection.host}`}.`);
			const connectionLabel = connection.alias || `${connection.user}@${connection.host}`;
			connectionsProvider.setInactive(connectionLabel);
		},
		null,
		context.subscriptions
	);
}
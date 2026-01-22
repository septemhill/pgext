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

export function getSQLWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, initialQuery?: string): string {
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js'));
	const nonce = getNonce();

	return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SQL Query</title>
            <script nonce="${nonce}">
                window.view = 'sqlQuery';
                window.initialQuery = ${JSON.stringify(initialQuery || '')};
            </script>
        </head>
        <body><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body>
        </html>`;
}

export function createQueryWebviewPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connection: any, client: Client, connectionsProvider: ConnectionsProvider, initialQuery?: string) {
	const panel = vscode.window.createWebviewPanel(
		'sqlQuery',
		`Query: ${connection.alias || `${connection.user}@${connection.host}`}`,
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	panel.webview.html = getSQLWebviewContent(context, panel, initialQuery);

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
			} else if (message.command === 'saveQuery') {
				const connectionLabel = connection.alias || `${connection.user}@${connection.host}`;
				const bookmarksKey = `bookmarks.${connectionLabel}`;
				const bookmarks = context.globalState.get<any[]>(bookmarksKey) || [];

				const name = await vscode.window.showInputBox({
					prompt: 'Enter a name for this bookmark',
					placeHolder: 'e.g. Get All Users',
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
			await client.end();
			outputChannel.appendLine(`Disconnected from ${connection.alias || `${connection.user}@${connection.host}`}.`);
			const connectionLabel = connection.alias || `${connection.user}@${connection.host}`;
			connectionsProvider.setInactive(connectionLabel);
		},
		null,
		context.subscriptions
	);
}
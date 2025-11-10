import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Client, FieldDef } from 'pg';
import { ConnectionsProvider } from './connectionsProvider';

export function getSQLWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	const htmlPath = path.join(context.extensionPath, 'media', 'PgSQLInputWebView.html');
	let html = fs.readFileSync(htmlPath, 'utf8');

	const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'sql_webview.js');
	const scriptUri = webview.asWebviewUri(scriptPath);

	// 取代模板佔位符
	html = html.replace('{{webviewScriptUri}}', scriptUri.toString());

	return html;
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

	panel.webview.html = getSQLWebviewContent(context, panel.webview);
	outputChannel.appendLine(`Query Webview HTML content: ${panel.webview.html}`);

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
			connectionsProvider.setInactive(connection.alias || `${connection.user}@${connection.host}`);
		},
		null,
		context.subscriptions
	);
}
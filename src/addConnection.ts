import * as vscode from 'vscode';
import { Client } from 'pg';
import { createClient } from 'redis';
import * as path from 'path';

// Constants
const WEBVIEW_PANEL_TYPE = 'addPostgresConnection';
const CONNECTIONS_KEY = 'postgres.connections';

const COMMAND_TEST_CONNECTION = 'testConnection';
const COMMAND_SAVE_CONNECTION = 'saveConnection';
const COMMAND_TEST_CONNECTION_RESULT = 'testConnectionResult';
const COMMAND_SAVE_CONNECTION_RESULT = 'saveConnectionResult';

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function getWebviewContent(
	context: vscode.ExtensionContext,
	panel: vscode.WebviewPanel,
	connection?: any,
	originalAlias?: string
): string {
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'main.js'));
	const nonce = getNonce();

	const initialData = {
		alias: connection?.alias || '',
		host: connection?.host || '',
		port: connection?.port?.toString() || '5432',
		user: connection?.user || '',
		password: connection?.password || '',
		database: connection?.database || '',
		dbType: connection?.dbType || 'postgres', // Add dbType to initialData
		originalAlias: originalAlias || '',
	};

	return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Postgres Connection</title>
			<script nonce="${nonce}">window.initialData = ${JSON.stringify(initialData)}; window.view = 'addConnection';</script>
		</head>
		<body><div id="root"></div><script nonce="${nonce}" src="${scriptUri}"></script></body>
		</html>`;
}

interface ConnectionsProvider {
	refresh(): void;
}

async function handleTestConnection(panel: vscode.WebviewPanel, message: any) {
	const { dbType, host, port, user, password, database } = message.data;
	if (dbType === 'postgres') {
		const client = new Client({ host, port: parseInt(port, 10), user, password, database, connectionTimeoutMillis: 5000 });
		try {
			await client.connect();
			panel.webview.postMessage({ command: COMMAND_TEST_CONNECTION_RESULT, success: true });
		} catch (error: any) {
			panel.webview.postMessage({ command: COMMAND_TEST_CONNECTION_RESULT, success: false, error: error.message });
		} finally {
			await client.end();
		}
	} else if (dbType === 'redis') {
		const client = createClient({
			socket: {
				host: host,
				port: parseInt(port, 10),
				connectTimeout: 5000
			},
			password: password
		});
		try {
			await client.connect();
			panel.webview.postMessage({ command: COMMAND_TEST_CONNECTION_RESULT, success: true });
		} catch (error: any) {
			panel.webview.postMessage({ command: COMMAND_TEST_CONNECTION_RESULT, success: false, error: error.message });
		} finally {
			await client.quit();
		}
	}

}

async function handleSaveConnection(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, connectionsProvider: ConnectionsProvider, message: { data: any, originalAlias?: string }) {
	const { alias: inputAlias, host, port, user, password, database, dbType } = message.data;
	const alias = inputAlias || `${user}@${host}`;

	let connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];

	if (message.originalAlias) {
		// Editing existing connection
		const connectionIndex = connections.findIndex(c => (c.alias || `${c.user}@${c.host}`) === message.originalAlias);
		if (connectionIndex === -1) {
			panel.webview.postMessage({ command: COMMAND_SAVE_CONNECTION_RESULT, success: false, error: `Original connection "${message.originalAlias}" not found.` });
			return;
		}

		// If alias is changed, check for conflicts
		if (message.originalAlias !== alias && connections.some((c, i) => (c.alias || `${c.user}@${c.host}`) === alias && i !== connectionIndex)) {
			panel.webview.postMessage({ command: COMMAND_SAVE_CONNECTION_RESULT, success: false, error: `Alias "${alias}" already exists.` });
			return;
		}

		connections[connectionIndex] = { alias, host, port, user, password, database, dbType };
	} else {
		// Adding new connection
		if (connections.some(c => (c.alias || `${c.user}@${c.host}`) === alias)) {
			panel.webview.postMessage({ command: COMMAND_SAVE_CONNECTION_RESULT, success: false, error: `Alias "${alias}" already exists.` });
			return;
		}

		const newConnection = { alias, host, port, user, password, database, dbType };
		connections.push(newConnection);
	}

	await context.globalState.update(CONNECTIONS_KEY, connections);

	vscode.window.showInformationMessage('Connection saved successfully!');
	connectionsProvider.refresh();

	panel.dispose();
}

export function createConnectionPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connectionsProvider: ConnectionsProvider, connectionToEdit?: any) {
	const title = connectionToEdit ? 'Edit Postgres Connection' : 'Add Postgres Connection';
	const originalAlias = connectionToEdit ? (connectionToEdit.alias || `${connectionToEdit.user}@${connectionToEdit.host}`) : undefined;

	const panel = vscode.window.createWebviewPanel(WEBVIEW_PANEL_TYPE, title, vscode.ViewColumn.One, { enableScripts: true });

	panel.webview.html = getWebviewContent(context, panel, connectionToEdit, originalAlias);

	panel.webview.onDidReceiveMessage(async message => {
		if (message.command === COMMAND_TEST_CONNECTION) {
			await handleTestConnection(panel, message);
		} else if (message.command === COMMAND_SAVE_CONNECTION) {
			await handleSaveConnection(panel, context, connectionsProvider, message);
		}
	}, undefined, context.subscriptions);
}

export function registerAddConnectionCommand(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connectionsProvider: ConnectionsProvider) {
	const addConnectionCommand = vscode.commands.registerCommand('postgres.addConnection', () => {
		outputChannel.appendLine('Command "postgres.addConnection" was executed.');
		createConnectionPanel(context, outputChannel, connectionsProvider);
	});

	context.subscriptions.push(addConnectionCommand);
}
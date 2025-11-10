import * as vscode from 'vscode';
import { Client } from 'pg';

function getWebviewContent(connection?: any, originalAlias?: string): string {
	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Add Postgres Connection</title>
				<style>
					body { font-family: sans-serif; padding: 0 20px; }
					.form-group { margin-bottom: 15px; }
					label { display: block; margin-bottom: 5px; }
					input { width: 100%; padding: 8px; box-sizing: border-box; }
					.buttons { margin-top: 20px; }
					button { padding: 10px 15px; margin-right: 10px; }
				</style>
			</head>
			<body>
				<h1>Add New Connection</h1>
				<div class="form-group">
					<label for="alias">Alias</label>
					<input id="alias" type="text" value="${connection?.alias || ''}" />
				</div>
				<div class="form-group">
					<label for="host">Host</label>
					<input id="host" type="text" value="${connection?.host || ''}" />
				</div>
				<div class="form-group">
					<label for="port">Port</label>
					<input id="port" type="number" value="${connection?.port || '5432'}" />
				</div>
				<div class="form-group">
					<label for="user">User</label>
					<input id="user" type="text" value="${connection?.user || ''}" />
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input id="password" type="password" value="${connection?.password || ''}" />
				</div>
				<div class="form-group">
					<label for="database">Database</label>
					<input id="database" type="text" value="${connection?.database || ''}" />
				</div>
				<div class="buttons">
					<button id="test-connection">Test Connection</button>
					<button id="save-connection">Save Connection</button>
				</div>
				<div id="result-message" style="margin-top: 15px;"></div>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('test-connection').addEventListener('click', () => {
						document.getElementById('result-message').textContent = '';
						const host = document.getElementById('host').value;
						const port = document.getElementById('port').value;
						const user = document.getElementById('user').value;
						const password = document.getElementById('password').value;
						const database = document.getElementById('database').value;

						vscode.postMessage({
							command: 'testConnection',
							data: { host, port, user, password, database }
						});
					});

					document.getElementById('save-connection').addEventListener('click', () => {
						document.getElementById('result-message').textContent = '';
						const alias = document.getElementById('alias').value;
						const host = document.getElementById('host').value;
						const port = document.getElementById('port').value;
						const user = document.getElementById('user').value;
						const password = document.getElementById('password').value;
						const database = document.getElementById('database').value;
						vscode.postMessage({
							command: 'saveConnection',
							originalAlias: '${originalAlias || ''}',
							data: { alias, host, port, user, password, database },
						});
					});


					window.addEventListener('message', event => {
						const message = event.data;
						const resultDiv = document.getElementById('result-message');

						switch (message.command) {
							case 'testConnectionResult':
								if (message.success) {
									resultDiv.style.color = 'green';
									resultDiv.textContent = 'Connection successful!';
								} else {
									resultDiv.style.color = 'red';
									resultDiv.textContent = 'Connection failed: ' + message.error;
								}
								break;
							case 'saveConnectionResult':
								if (!message.success) {
									resultDiv.style.color = 'red';
									resultDiv.textContent = 'Save failed: ' + message.error;
								}
								break;
						}
					});
				</script>
			</body>
			</html>`;
}

interface ConnectionsProvider {
	refresh(): void;
}

async function handleTestConnection(panel: vscode.WebviewPanel, message: any) {
	const { host, port, user, password, database } = message.data;
	const client = new Client({ host, port: parseInt(port, 10), user, password, database, connectionTimeoutMillis: 5000 });
	try {
		await client.connect();
		panel.webview.postMessage({ command: 'testConnectionResult', success: true });
	} catch (error: any) {
		panel.webview.postMessage({ command: 'testConnectionResult', success: false, error: error.message });
	} finally {
		await client.end();
	}
}

async function handleSaveConnection(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, connectionsProvider: ConnectionsProvider, message: { data: any, originalAlias?: string }) {
	const { alias: inputAlias, host, port, user, password, database } = message.data;
	const alias = inputAlias || `${user}@${host}`;

	let connections = context.globalState.get<any[]>('postgres.connections') || [];

	if (message.originalAlias) {
		// Editing existing connection
		const connectionIndex = connections.findIndex(c => (c.alias || `${c.user}@${c.host}`) === message.originalAlias);
		if (connectionIndex === -1) {
			panel.webview.postMessage({ command: 'saveConnectionResult', success: false, error: `Original connection "${message.originalAlias}" not found.` });
			return;
		}

		// If alias is changed, check for conflicts
		if (message.originalAlias !== alias && connections.some((c, i) => (c.alias || `${c.user}@${c.host}`) === alias && i !== connectionIndex)) {
			panel.webview.postMessage({ command: 'saveConnectionResult', success: false, error: `Alias "${alias}" already exists.` });
			return;
		}

		connections[connectionIndex] = { alias, host, port, user, password, database };
	} else {
		// Adding new connection
		if (connections.some(c => (c.alias || `${c.user}@${c.host}`) === alias)) {
			panel.webview.postMessage({ command: 'saveConnectionResult', success: false, error: `Alias "${alias}" already exists.` });
			return;
		}

		const newConnection = { alias, host, port, user, password, database };
		connections.push(newConnection);
	}

	await context.globalState.update('postgres.connections', connections);

	vscode.window.showInformationMessage('Connection saved successfully!');
	connectionsProvider.refresh();

	panel.dispose();
}

export function createConnectionPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connectionsProvider: ConnectionsProvider, connectionToEdit?: any) {
	const title = connectionToEdit ? 'Edit Postgres Connection' : 'Add Postgres Connection';
	const originalAlias = connectionToEdit ? (connectionToEdit.alias || `${connectionToEdit.user}@${connectionToEdit.host}`) : undefined;

	const panel = vscode.window.createWebviewPanel('addPostgresConnection', title, vscode.ViewColumn.One, { enableScripts: true });

	panel.webview.html = getWebviewContent(connectionToEdit, originalAlias);

	panel.webview.onDidReceiveMessage(async message => {
		if (message.command === 'testConnection') {
			await handleTestConnection(panel, message);
		} else if (message.command === 'saveConnection') {
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
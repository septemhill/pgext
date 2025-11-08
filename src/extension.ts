// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Client, FieldDef } from 'pg';
import { ConnectionsProvider } from './connectionsProvider';
import { registerAddConnectionCommand } from './addConnection';

function createQueryWebviewPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, connection: any, client: Client) {
	const panel = vscode.window.createWebviewPanel(
		'sqlQuery',
		`Query: ${connection.alias || `${connection.user}@${connection.host}`}`,
		vscode.ViewColumn.Two,
		{
			enableScripts: true
		}
	);

	panel.webview.html = getSQLWebviewContent();

	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'executeQuery':
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
						panel.webview.postMessage({
							command: 'queryError',
							error: error.message
						});
					}
					return;
			}
		},
		undefined,
		context.subscriptions
	);

	panel.onDidDispose(
		async () => {
			await client.end();
			outputChannel.appendLine(`Disconnected from ${connection.alias || `${connection.user}@${connection.host}`}.`);
			panel.dispose();
		},
		null,
		context.subscriptions
	);
}

function getSQLWebviewContent(): string {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>SQL Query</title>
		<style>
			body { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; }
			.editor-container { padding: 10px; }
			#sql-editor { width: 100%; height: 150px; box-sizing: border-box; }
			.error-container { padding: 10px; color: red; }
			.result-container { flex-grow: 1; overflow: auto; padding: 10px; }
			table { border-collapse: collapse; width: 100%; }
			th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
			th { background-color: #f2f2f2; }
		</style>
	</head>
	<body>
		<div class="editor-container">
			<textarea id="sql-editor" placeholder="Enter your SQL query here..."></textarea>
			<button id="execute-button">Execute</button>
		</div>
		<div id="error-container" class="error-container"></div>
		<div id="result-container" class="result-container"></div>
		<script>${getWebviewScript()}</script>
	</body>
	</html>`;
}

function getWebviewScript(): string {
	return `
		const vscode = acquireVsCodeApi();
		const executeButton = document.getElementById('execute-button');
		const sqlEditor = document.getElementById('sql-editor');
		const errorContainer = document.getElementById('error-container');
		const resultContainer = document.getElementById('result-container');

		executeButton.addEventListener('click', () => {
			const sql = sqlEditor.value;
			errorContainer.textContent = '';
			resultContainer.innerHTML = '';
			vscode.postMessage({ command: 'executeQuery', sql: sql });
		});

		window.addEventListener('message', event => {
			const message = event.data;
			switch (message.command) {
				case 'queryResult':
					const { rows, fields } = message.result;
					if (rows.length === 0) {
						resultContainer.textContent = 'Query executed successfully, but no rows were returned.';
						return;
					}
					const table = document.createElement('table');
					const thead = table.createTHead();
					const headerRow = thead.insertRow();
					fields.forEach(fieldName => {
						const th = document.createElement('th');
						th.textContent = fieldName;
						headerRow.appendChild(th);
					});

					const tbody = table.createTBody();
					rows.forEach(rowData => {
						const row = tbody.insertRow();
						fields.forEach(fieldName => {
							const cell = row.insertCell();
							cell.textContent = rowData[fieldName];
						});
					});
					resultContainer.appendChild(table);
					break;
				case 'queryError':
					errorContainer.textContent = message.error;
					break;
			}
		});
	`;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Create a dedicated output channel for the extension
	const outputChannel = vscode.window.createOutputChannel('Postgres Extension');

	// Create and register the connections view
	const connectionsProvider = new ConnectionsProvider(context);
	vscode.window.registerTreeDataProvider('postgresView', connectionsProvider);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	outputChannel.appendLine('Congratulations, your extension "postgres" is now active!');
	outputChannel.appendLine('This extension now has a dedicated output channel named "Postgres Extension".');

	// The command has been defined in the package.json file


	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('postgres.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from postgres!');
	});

	context.subscriptions.push(disposable);

	registerAddConnectionCommand(context, outputChannel, connectionsProvider);

	// Register new commands for connection actions
	context.subscriptions.push(
		vscode.commands.registerCommand('postgres.connect', async (connectionItem: vscode.TreeItem) => {
			const connections = context.globalState.get<any[]>('postgres.connections') || [];
			const connection = connections.find(c => (c.alias || `${c.user}@${c.host}`) === connectionItem.label);

			if (!connection) {
				vscode.window.showErrorMessage('Connection details not found.');
				return;
			}

			outputChannel.appendLine(`Connecting to ${connection.alias || `${connection.user}@${connection.host}`}`);
			vscode.window.showInformationMessage(`Connecting to ${connection.alias || `${connection.user}@${connection.host}`}`);

			const client = new Client({
				host: connection.host,
				port: parseInt(connection.port, 10),
				user: connection.user,
				password: connection.password,
				database: connection.database,
				connectionTimeoutMillis: 5000
			});

			try {
				await client.connect();
				vscode.window.showInformationMessage(`Successfully connected to ${connection.alias || `${connection.user}@${connection.host}`}!`);
				outputChannel.appendLine(`Successfully connected to ${connection.alias || `${connection.user}@${connection.host}`}!`);
				createQueryWebviewPanel(context, outputChannel, connection, client);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
				outputChannel.appendLine(`Failed to connect to ${connection.alias || `${connection.user}@${connection.host}`}: ${error.message}`);
				await client.end();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('postgres.editConnection', (connectionItem: vscode.TreeItem) => {
			outputChannel.appendLine(`Editing connection ${connectionItem.label}`);
			vscode.window.showInformationMessage(`Editing connection ${connectionItem.label}`);
			// TODO: Implement actual edit logic here (e.g., open a webview for editing)
			// This would be similar to addConnection but pre-filled with existing data
			// and would update the connection instead of adding a new one.
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('postgres.deleteConnection', async (connectionItem: vscode.TreeItem) => {
			const confirm = await vscode.window.showWarningMessage(
				`Are you sure you want to delete the connection "${connectionItem.label}"?`,
				{ modal: true },
				'Yes'
			);

			if (confirm === 'Yes') {
				let connections = context.globalState.get<any[]>('postgres.connections') || [];
				const updatedConnections = connections.filter(c => (c.alias || `${c.user}@${c.host}`) !== connectionItem.label);

				await context.globalState.update('postgres.connections', updatedConnections);
				connectionsProvider.refresh();

				outputChannel.appendLine(`Deleting connection ${connectionItem.label}`);
				vscode.window.showInformationMessage(`Successfully deleted connection "${connectionItem.label}"`);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

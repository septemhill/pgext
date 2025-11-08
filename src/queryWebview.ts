import * as vscode from 'vscode';
import { Client, FieldDef } from 'pg';
import { ConnectionsProvider } from './connectionsProvider';

function getSQLWebviewContent(): string {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>SQL Query</title>
		<style>
			body { 
				font-family: sans-serif; 
				display: flex; 
				flex-direction: column; 
				height: 100vh; 
				margin: 0; 
				color: var(--vscode-editor-foreground);
				background-color: var(--vscode-editor-background);
			}
			.editor-container { padding: 10px; }
			#sql-editor { 
				width: 100%; 
				height: 150px; 
				box-sizing: border-box;
				background-color: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				border: 1px solid var(--vscode-input-border);
			}
			.error-container { padding: 10px; color: red; }
			.result-container { flex-grow: 1; overflow: auto; padding: 10px; }
			table { border-collapse: collapse; width: 100%; }
			th, td { border: 1px solid var(--vscode-panel-border); padding: 8px; text-align: left; }
			th { 
				background-color: var(--vscode-side-bar-background);
				color: var(--vscode-editor-foreground);
			}
			button {
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				border: 1px solid var(--vscode-button-border);
				padding: 4px 8px;
				margin-top: 5px;
			}
			button:hover {
				background-color: var(--vscode-button-hover-background);
			}
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

	panel.webview.html = getSQLWebviewContent();

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
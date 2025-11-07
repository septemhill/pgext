// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Client } from 'pg';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Create a dedicated output channel for the extension
	const outputChannel = vscode.window.createOutputChannel('Postgres Extension');

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

	const addConnection = vscode.commands.registerCommand('postgres.addConnection', () => {
		outputChannel.appendLine('Command "postgres.addConnection" was executed.');
		const panel = vscode.window.createWebviewPanel(
			'addPostgresConnection', // Identifies the type of the webview. Used internally
			'Add Postgres Connection', // Title of the panel displayed to the user
			vscode.ViewColumn.One,
			{
				// Enable scripts in the webview
				enableScripts: true
			}
		);

		panel.webview.html = `<!DOCTYPE html>
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
					<label for="host">Host</label>
					<input id="host" type="text" />
				</div>
				<div class="form-group">
					<label for="port">Port</label>
					<input id="port" type="number" value="5432" />
				</div>
				<div class="form-group">
					<label for="user">User</label>
					<input id="user" type="text" />
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input id="password" type="password" />
				</div>
				<div class="form-group">
					<label for="database">Database</label>
					<input id="database" type="text" />
				</div>
				<div class="buttons">
					<button id="test-connection">Test Connection</button>
					<button id="save-connection">Save</button>
				</div>
				<div id="result-message" style="margin-top: 15px;"></div>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('test-connection').addEventListener('click', () => {
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
						}
					});
				</script>
			</body>
			</html>`;

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async message => {
				outputChannel.appendLine(`Received message from webview: ${JSON.stringify(message)}`);
				switch (message.command) {
					case 'testConnection':
						const { host, port, user, password, database } = message.data;
						const client = new Client({
							host,
							port: parseInt(port, 10),
							user,
							password,
							database,
							connectionTimeoutMillis: 5000, // 5 seconds timeout
						});

						try {
							outputChannel.appendLine('Attempting to connect to PostgreSQL...');
							await client.connect();
							outputChannel.appendLine('PostgreSQL connection successful.');
							panel.webview.postMessage({ command: 'testConnectionResult', success: true });
						} catch (error: any) {
							outputChannel.appendLine(`PostgreSQL connection failed: ${error.message}`);
							panel.webview.postMessage({ command: 'testConnectionResult', success: false, error: error.message });
						} finally {
							outputChannel.appendLine('Ending PostgreSQL client connection.');
							await client.end();
						}
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(addConnection);
}

// This method is called when your extension is deactivated
export function deactivate() { }

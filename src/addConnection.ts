import * as vscode from 'vscode';
import { Client } from 'pg';

function getWebviewContent(): string {
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
}

export function registerAddConnectionCommand(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    const addConnectionCommand = vscode.commands.registerCommand('postgres.addConnection', () => {
        outputChannel.appendLine('Command "postgres.addConnection" was executed.');
        const panel = vscode.window.createWebviewPanel(
            'addPostgresConnection',
            'Add Postgres Connection',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'testConnection') {
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
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(addConnectionCommand);
}
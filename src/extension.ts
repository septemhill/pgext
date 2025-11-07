// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "postgres" is now active!');

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
			</body>
			</html>`;
	});

	context.subscriptions.push(addConnection);
}

// This method is called when your extension is deactivated
export function deactivate() { }

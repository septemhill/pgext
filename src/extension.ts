// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Client } from 'pg';
import { ConnectionsProvider, ActiveConnection } from './connectionsProvider';
import { registerAddConnectionCommand, createConnectionPanel } from './addConnection.ts';
import { createQueryWebviewPanel } from './queryWebview';

// Constants
const OUTPUT_CHANNEL_NAME = 'Postgres Extension';
const VIEW_ID = 'postgresView';
const CONNECTIONS_KEY = 'postgres.connections';

const COMMAND_HELLO_WORLD = 'postgres.helloWorld';
const COMMAND_CONNECT = 'postgres.connect';
const COMMAND_EDIT_CONNECTION = 'postgres.editConnection';
const COMMAND_DELETE_CONNECTION = 'postgres.deleteConnection';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Create a dedicated output channel for the extension
	const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);

	// Create and register the connections view
	const connectionsProvider = new ConnectionsProvider(context);
	vscode.window.registerTreeDataProvider(VIEW_ID, connectionsProvider);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	outputChannel.appendLine('Congratulations, your extension "postgres" is now active!');
	outputChannel.appendLine(`This extension now has a dedicated output channel named "${OUTPUT_CHANNEL_NAME}".`);

	// The command has been defined in the package.json file


	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand(COMMAND_HELLO_WORLD, () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from postgres!');
	});

	context.subscriptions.push(disposable);

	registerAddConnectionCommand(context, outputChannel, connectionsProvider);

	// Register new commands for connection actions
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_CONNECT, async (connectionItem: vscode.TreeItem) => {
			const connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
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

				const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
				const tables = tablesResult.rows.map(row => row.table_name);
				connectionsProvider.setActive(connectionItem.label as string, client, tables);

				createQueryWebviewPanel(context, outputChannel, connection, client, connectionsProvider);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
				outputChannel.appendLine(`Failed to connect to ${connection.alias || `${connection.user}@${connection.host}`}: ${error.message}`);
				await client.end();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_EDIT_CONNECTION, (connectionItem: vscode.TreeItem) => {
			const connectionLabel = connectionItem.label as string;
			outputChannel.appendLine(`Editing connection ${connectionLabel}`);

			const connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
			const connectionToEdit = connections.find(c => (c.alias || `${c.user}@${c.host}`) === connectionLabel);

			if (connectionToEdit) {
				createConnectionPanel(context, outputChannel, connectionsProvider, connectionToEdit);
			} else {
				vscode.window.showErrorMessage(`Connection "${connectionLabel}" not found.`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_DELETE_CONNECTION, async (connectionItem: vscode.TreeItem) => {
			const confirm = await vscode.window.showWarningMessage(
				`Are you sure you want to delete the connection "${connectionItem.label}"?`,
				{ modal: true },
				'Yes'
			);

			if (confirm === 'Yes') {
				let connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
				const updatedConnections = connections.filter(c => (c.alias || `${c.user}@${c.host}`) !== connectionItem.label);

				await context.globalState.update(CONNECTIONS_KEY, updatedConnections);
				connectionsProvider.refresh();

				outputChannel.appendLine(`Deleting connection ${connectionItem.label}`);
				vscode.window.showInformationMessage(`Successfully deleted connection "${connectionItem.label}"`);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

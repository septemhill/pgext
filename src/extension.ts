// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConnectionsProvider } from './connectionsProvider';
import { registerAddConnectionCommand, createConnectionPanel } from './addConnection';
import { ProviderRegistry, ConnectionMetadata } from './providers';
import { PostgresProvider } from './providers/postgresProvider';
import { RedisProvider } from './providers/redisProvider';

// Constants
const OUTPUT_CHANNEL_NAME = 'Postgres Extension';
const VIEW_ID = 'postgresView';
const CONNECTIONS_KEY = 'postgres.connections';

const COMMAND_HELLO_WORLD = 'postgres.helloWorld';
const COMMAND_CONNECT = 'postgres.connect';
const COMMAND_EDIT_CONNECTION = 'postgres.editConnection';
const COMMAND_DELETE_CONNECTION = 'postgres.deleteConnection';

// Register providers
ProviderRegistry.register(new PostgresProvider());
ProviderRegistry.register(new RedisProvider());

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
	outputChannel.appendLine('Congratulations, your extension is now active!');

	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand(COMMAND_HELLO_WORLD, () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Multi-DB Extension!');
	});

	context.subscriptions.push(disposable);

	registerAddConnectionCommand(context, outputChannel, connectionsProvider);

	// Register new commands for connection actions
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_CONNECT, async (connectionItem: vscode.TreeItem) => {
			const connectionLabel = connectionItem.description as string;
			const connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
			const connection = connections.find(c => (c.alias || `${c.user}@${c.host}`) === connectionLabel);

			if (!connection) {
				vscode.window.showErrorMessage('Connection details not found.');
				return;
			}

			const provider = ProviderRegistry.getProvider(connection.dbType || 'postgres');
			if (!provider) {
				vscode.window.showErrorMessage(`No provider found for database type: ${connection.dbType}`);
				return;
			}

			outputChannel.appendLine(`Connecting to ${connectionLabel} (${provider.type})`);
			vscode.window.showInformationMessage(`Connecting to ${connectionLabel}...`);

			try {
				const client = await provider.connect(connection);
				vscode.window.showInformationMessage(`Successfully connected to ${connectionLabel}!`);
				outputChannel.appendLine(`Successfully connected to ${connectionLabel}!`);

				let metadata: ConnectionMetadata;
				if (provider.getMetadata) {
					metadata = await provider.getMetadata(client);
				} else {
					if (provider.type === 'redis') {
						metadata = { type: 'redis' };
					} else {
						metadata = { type: 'postgres', tables: [] };
					}
				}
				connectionsProvider.setActive(connectionLabel, client, metadata);

				provider.createQueryPanel(context, outputChannel, connection, client, connectionsProvider);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
				outputChannel.appendLine(`Failed to connect to ${connectionLabel}: ${error.message}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_EDIT_CONNECTION, (connectionItem: vscode.TreeItem) => {
			const connectionLabel = connectionItem.description as string;
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
		vscode.commands.registerCommand('postgres.disconnect', async (connectionItem: vscode.TreeItem) => {
			const connectionLabel = connectionItem.description as string;
			const activeConnection = connectionsProvider.getActiveConnection(connectionLabel);

			if (!activeConnection) {
				vscode.window.showInformationMessage(`Connection "${connectionLabel}" is not active.`);
				return;
			}

			const connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
			const connection = connections.find(c => (c.alias || `${c.user}@${c.host}`) === connectionLabel);

			if (!connection) {
				vscode.window.showErrorMessage('Connection details not found.');
				return;
			}

			const provider = ProviderRegistry.getProvider(connection.dbType || 'postgres');
			if (!provider) {
				vscode.window.showErrorMessage(`No provider found for database type: ${connection.dbType}`);
				return;
			}

			outputChannel.appendLine(`Disconnecting from ${connectionLabel} (${provider.type})`);
			try {
				await provider.disconnect(activeConnection.client);
				connectionsProvider.setInactive(connectionLabel);
				vscode.window.showInformationMessage(`Successfully disconnected from ${connectionLabel}.`);
				outputChannel.appendLine(`Successfully disconnected from ${connectionLabel}.`);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to disconnect: ${error.message}`);
				outputChannel.appendLine(`Failed to disconnect from ${connectionLabel}: ${error.message}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_DELETE_CONNECTION, async (connectionItem: vscode.TreeItem) => {
			const connectionLabel = connectionItem.description as string;

			const confirm = await vscode.window.showWarningMessage(
				`Are you sure you want to delete the connection "${connectionLabel}"?`,
				{ modal: true },
				'Yes'
			);

			if (confirm === 'Yes') {
				let connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
				const updatedConnections = connections.filter(c => (c.alias || `${c.user}@${c.host}`) !== connectionLabel);

				outputChannel.appendLine(`Updated connections: ${JSON.stringify(updatedConnections)}`);
				await context.globalState.update(CONNECTIONS_KEY, updatedConnections);
				connectionsProvider.refresh();
				connectionsProvider.setInactive(connectionLabel);

				outputChannel.appendLine(`Deleting connection ${connectionLabel}`);
				vscode.window.showInformationMessage(`Successfully deleted connection "${connectionLabel}"`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('db-extension.openBookmark', async (bookmark: any, connectionLabel: string) => {
			const connections = context.globalState.get<any[]>(CONNECTIONS_KEY) || [];
			const connection = connections.find(c => (c.alias || `${c.user}@${c.host}`) === connectionLabel);

			if (!connection) {
				vscode.window.showErrorMessage('Connection details not found.');
				return;
			}

			const provider = ProviderRegistry.getProvider(connection.dbType || 'postgres');
			if (!provider) {
				vscode.window.showErrorMessage(`No provider found for database type: ${connection.dbType}`);
				return;
			}

			const activeConnection = connectionsProvider.getActiveConnection(connectionLabel);
			if (!activeConnection) {
				vscode.window.showErrorMessage(`Please connect to "${connectionLabel}" before opening bookmarks.`);
				return;
			}

			// Open the panel with the bookmarked query and the active client.
			provider.createQueryPanel(context, outputChannel, connection, activeConnection.client, connectionsProvider, bookmark.query);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('postgres.editBookmark', async (bookmarkItem: any) => {
			const { bookmark, connectionLabel } = bookmarkItem;
			const newName = await vscode.window.showInputBox({
				prompt: 'Enter new name for bookmark',
				value: bookmark.name
			});

			if (newName && newName !== bookmark.name) {
				const bookmarksKey = `bookmarks.${connectionLabel}`;
				let bookmarks = context.globalState.get<any[]>(bookmarksKey) || [];
				const bookmarkIndex = bookmarks.findIndex(b => b.name === bookmark.name && b.query === bookmark.query);

				if (bookmarkIndex !== -1) {
					bookmarks[bookmarkIndex].name = newName;
					await context.globalState.update(bookmarksKey, bookmarks);
					connectionsProvider.refresh();
					vscode.window.showInformationMessage(`Bookmark renamed to "${newName}"`);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('postgres.deleteBookmark', async (bookmarkItem: any) => {
			const { bookmark, connectionLabel } = bookmarkItem;
			const confirm = await vscode.window.showWarningMessage(
				`Are you sure you want to delete bookmark "${bookmark.name}"?`,
				{ modal: true },
				'Yes'
			);

			if (confirm === 'Yes') {
				const bookmarksKey = `bookmarks.${connectionLabel}`;
				let bookmarks = context.globalState.get<any[]>(bookmarksKey) || [];
				const updatedBookmarks = bookmarks.filter(b => !(b.name === bookmark.name && b.query === bookmark.query));

				await context.globalState.update(bookmarksKey, updatedBookmarks);
				connectionsProvider.refresh();
				vscode.window.showInformationMessage(`Bookmark "${bookmark.name}" deleted`);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }

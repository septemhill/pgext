import * as vscode from 'vscode';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { DatabaseProvider, ConnectionConfig, RedisConfig } from './index';
import { createRedisQueryWebviewPanel } from '../redisQueryWebview';

export class RedisProvider implements DatabaseProvider {
    type = 'redis';

    async connect(connection: ConnectionConfig): Promise<RedisClientType> {
        const redisConfig = connection as RedisConfig;
        const url = `redis://${redisConfig.password ? `:${redisConfig.password}@` : ''}${redisConfig.host}:${redisConfig.port}`;
        const client = createRedisClient({
            url,
            socket: {
                connectTimeout: 5000
            }
        });
        await client.connect();
        return client as RedisClientType;
    }

    async disconnect(client: RedisClientType): Promise<void> {
        await client.quit();
    }

    async getTreeItems(client: RedisClientType): Promise<vscode.TreeItem[]> {
        // Redis currently doesn't show sub-items in this extension's tree view
        return [];
    }

    async getMetadata(client: RedisClientType): Promise<any> {
        return { tables: [] };
    }

    createQueryPanel(
        context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        connection: ConnectionConfig,
        client: any,
        connectionsProvider: any,
        initialQuery?: string
    ): void {
        createRedisQueryWebviewPanel(context, outputChannel, connection, client, connectionsProvider, initialQuery);
    }
}

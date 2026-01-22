import React, { useState, useEffect } from 'react';
import { vscodeApi } from '../../vscode';
import { useVSCodeMessage } from '../../hooks/useVSCodeMessage';
import PostgresForm from '../../components/forms/PostgresForm';
import RedisForm from '../../components/forms/RedisForm';

// @ts-ignore
const initialData = window.initialData || {};

const AddConnectionView: React.FC = () => {
    const [alias, setAlias] = useState(initialData.alias || '');
    const [host, setHost] = useState(initialData.host || '');
    const [port, setPort] = useState(initialData.port || '');
    const [user, setUser] = useState(initialData.user || '');
    const [password, setPassword] = useState(initialData.password || '');
    const [database, setDatabase] = useState(initialData.database || '');
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [dbType, setDbType] = useState(initialData.dbType || 'postgres');

    useEffect(() => {
        if (!initialData.port) {
            if (dbType === 'postgres') {
                setPort('5432');
            } else if (dbType === 'redis') {
                setPort('6379');
            }
        }
    }, [dbType]);

    useVSCodeMessage({
        testConnectionResult: (message) => {
            setResultMessage({
                type: message.success ? 'success' : 'error',
                text: message.success ? 'Connection successful!' : `Connection failed: ${message.error}`,
            });
        },
        saveConnectionResult: (message) => {
            if (!message.success) {
                setResultMessage({ type: 'error', text: `Save failed: ${message.error}` });
            }
        },
    });

    const handleTestConnection = () => {
        setResultMessage(null);
        vscodeApi.postMessage({
            command: 'testConnection',
            data: { dbType, host, port, user, password, database },
        });
    };

    const handleSaveConnection = () => {
        setResultMessage(null);
        vscodeApi.postMessage({
            command: 'saveConnection',
            originalAlias: initialData.originalAlias,
            data: { alias, host, port, user, password, database, dbType },
        });
    };

    return (
        <div className="view-container">
            <h1>{initialData.originalAlias ? 'Edit' : 'Add'} Connection</h1>

            <div className="form-group">
                <label htmlFor="dbType">Database Type</label>
                <select id="dbType" value={dbType} onChange={(e) => {
                    setDbType(e.target.value);
                    setUser('');
                    setDatabase('');
                }}>
                    <option value="postgres">Postgres</option>
                    <option value="redis">Redis</option>
                </select>
            </div>

            {dbType === 'postgres' && (
                <PostgresForm
                    alias={alias} setAlias={setAlias}
                    host={host} setHost={setHost}
                    port={port} setPort={setPort}
                    user={user} setUser={setUser}
                    password={password} setPassword={setPassword}
                    database={database} setDatabase={setDatabase}
                />
            )}

            {dbType === 'redis' && (
                <RedisForm
                    alias={alias} setAlias={setAlias}
                    host={host} setHost={setHost}
                    port={port} setPort={setPort}
                    password={password} setPassword={setPassword}
                />
            )}

            <div className="button-group">
                <button className="secondary" onClick={handleTestConnection}>Test Connection</button>
                <button className="primary" onClick={handleSaveConnection}>Save Connection</button>
            </div>

            {resultMessage && (
                <div className={`message ${resultMessage.type}`}>
                    {resultMessage.text}
                </div>
            )}

            <style>{`
        .view-container { padding: 20px; max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 500; }
        input, select { 
          width: 100%; 
          padding: 10px; 
          border: 1px solid var(--vscode-input-border);
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border-radius: 4px;
        }
        .button-group { display: flex; gap: 10px; margin-top: 30px; }
        button { 
          padding: 10px 20px; 
          border-radius: 4px; 
          cursor: pointer; 
          border: none;
          font-weight: 600;
        }
        button.primary { 
          background: var(--vscode-button-background); 
          color: var(--vscode-button-foreground); 
        }
        button.primary:hover { background: var(--vscode-button-hover-background); }
        button.secondary { 
          background: var(--vscode-button-secondaryBackground, #5f5f5f); 
          color: var(--vscode-button-secondaryForeground, #ffffff); 
        }
        button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground, #4f4f4f); }
        .message { margin-top: 20px; padding: 12px; border-radius: 4px; }
        .message.success { background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid #4ade80; }
        .message.error { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid #f87171; }
      `}</style>
        </div>
    );
};

export default AddConnectionView;

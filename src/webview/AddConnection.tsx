import React, { useState, useEffect } from 'react';
import { vscodeApi } from './vscode';
import PostgresConnectionForm from './PostgresConnectionForm';
import RedisConnectionForm from './RedisConnectionForm';

// @ts-ignore
const initialData = window.initialData || {};

const AddConnection: React.FC = () => {
  const [alias, setAlias] = useState(initialData.alias || '');
  const [host, setHost] = useState(initialData.host || '');
  const [port, setPort] = useState(initialData.port || '');
  const [user, setUser] = useState(initialData.user || '');
  const [password, setPassword] = useState(initialData.password || '');
  const [database, setDatabase] = useState(initialData.database || '');
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dbType, setDbType] = useState('postgres');

  useEffect(() => {
    // Set default port based on dbType
    if (!initialData.port) {
      if (dbType === 'postgres') {
        setPort('5432');
      } else if (dbType === 'redis') {
        setPort('6379');
      }
    }
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'testConnectionResult':
          setResultMessage({
            type: message.success ? 'success' : 'error',
            text: message.success ? 'Connection successful!' : `Connection failed: ${message.error}`,
          });
          break;
        case 'saveConnectionResult':
          if (!message.success) {
            setResultMessage({ type: 'error', text: `Save failed: ${message.error}` });
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dbType, initialData.port]);

  const handleTestConnection = () => {
    setResultMessage(null);
    const connectionData = {
      dbType,
      host,
      port,
      user,
      password,
      database,
    };
    vscodeApi.postMessage({
      command: 'testConnection', data: connectionData
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
    <div style={{ fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>{initialData.originalAlias ? 'Edit' : 'Add'} Connection</h1>
      <div className="form-group">
        <label htmlFor="dbType">Database Type</label>
        <select id="dbType" value={dbType} onChange={(e) => {
          const newDbType = e.target.value;
          setDbType(newDbType);
          // Reset fields that are not common
          setUser('');
          setDatabase('');
        }}>
          <option value="postgres">Postgres</option>
          <option value="redis">Redis</option>
        </select>
      </div>

      {dbType === 'postgres' && (
        <PostgresConnectionForm
          alias={alias} setAlias={setAlias}
          host={host} setHost={setHost}
          port={port} setPort={setPort}
          user={user} setUser={setUser}
          password={password} setPassword={setPassword}
          database={database} setDatabase={setDatabase}
        />
      )}

      {dbType === 'redis' && (
        <RedisConnectionForm
          alias={alias} setAlias={setAlias}
          host={host} setHost={setHost}
          port={port} setPort={setPort}
          password={password} setPassword={setPassword}
        />
      )}

      <div className="buttons">
        <button onClick={handleTestConnection}>Test Connection</button>
        <button onClick={handleSaveConnection}>Save Connection</button>
      </div>
      {resultMessage && (
        <div style={{ marginTop: '15px', color: resultMessage.type === 'success' ? 'green' : 'red' }}>
          {resultMessage.text}
        </div>
      )}
      <style>{`
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; box-sizing: border-box; }
        select { width: 100%; padding: 8px; box-sizing: border-box; }
        .buttons { margin-top: 20px; }
        button { padding: 10px 15px; margin-right: 10px; }
      `}</style>
    </div>
  );
};

export default AddConnection;
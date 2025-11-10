import React, { useState, useEffect } from 'react';
import { vscodeApi } from './vscode';

// @ts-ignore
const initialData = window.initialData || {};

const AddConnection: React.FC = () => {
  const [alias, setAlias] = useState(initialData.alias || '');
  const [host, setHost] = useState(initialData.host || '');
  const [port, setPort] = useState(initialData.port || '5432');
  const [user, setUser] = useState(initialData.user || '');
  const [password, setPassword] = useState(initialData.password || '');
  const [database, setDatabase] = useState(initialData.database || '');
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
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
  }, []);

  const handleTestConnection = () => {
    setResultMessage(null);
    vscodeApi.postMessage({ command: 'testConnection', data: { host, port, user, password, database } });
  };

  const handleSaveConnection = () => {
    setResultMessage(null);
    vscodeApi.postMessage({
      command: 'saveConnection',
      originalAlias: initialData.originalAlias,
      data: { alias, host, port, user, password, database },
    });
  };

  const renderInput = (id: string, label: string, value: string, onChange: (val: string) => void, type = 'text') => (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>{initialData.originalAlias ? 'Edit' : 'Add'} Connection</h1>
      {renderInput('alias', 'Alias', alias, setAlias)}
      {renderInput('host', 'Host', host, setHost)}
      {renderInput('port', 'Port', port, setPort, 'number')}
      {renderInput('user', 'User', user, setUser)}
      {renderInput('password', 'Password', password, setPassword, 'password')}
      {renderInput('database', 'Database', database, setDatabase)}
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
        .buttons { margin-top: 20px; }
        button { padding: 10px 15px; margin-right: 10px; }
      `}</style>
    </div>
  );
};

export default AddConnection;
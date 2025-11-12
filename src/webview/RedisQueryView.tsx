import React, { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeApi } from './vscode';

const RedisQueryView: React.FC = () => {
  const [redisCommand, setRedisCommand] = useState('GET your_key');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCommandChange = useCallback((value: string) => {
    setRedisCommand(value);
  }, []);

  const executeCommand = () => {
    setError(null);
    setResult(null);
    vscodeApi.postMessage({ command: 'executeRedisCommand', redisCommand });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'queryResult':
          setResult(message.result);
          break;
        case 'queryError':
          setError(message.error);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const renderResult = () => {
    if (result === null && error === null) return <p>No results to display.</p>;
    if (result === null) return null;

    return (
      <pre>
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    );
  };

  return (
    <div className="container">
      <div className="editor-container">
        <CodeMirror
          value={redisCommand}
          height="150px"
          theme={vscodeDark}
          onChange={handleCommandChange}
        />
        <button onClick={executeCommand}>Execute</button>
      </div>
      {error && <div className="error-container">{error}</div>}
      <div className="result-container">{renderResult()}</div>
      <style>{`
        .container { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); }
        .editor-container { padding: 10px; position: relative; }
        .error-container { padding: 10px; color: red; }
        .result-container { flex-grow: 1; overflow: auto; padding: 10px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid var(--vscode-panel-border); padding: 8px; text-align: left; }
        th { background-color: var(--vscode-side-bar-background); }
        button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 4px 8px; margin-top: 5px; }
        button:hover { background-color: var(--vscode-button-hover-background); }
      `}</style>
    </div>
  );
};

export default RedisQueryView;
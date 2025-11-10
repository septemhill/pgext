import React, { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeApi } from './vscode';

interface QueryResult {
  rows: any[];
  fields: string[];
}

const SQLQueryView: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM your_table LIMIT 100;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setSqlQuery(value);
  }, []);

  const executeQuery = () => {
    setError(null);
    setResult(null);
    vscodeApi.postMessage({ command: 'executeQuery', sql: sqlQuery });
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

  const renderTable = () => {
    if (!result || result.rows.length === 0) return <p>No results to display.</p>;

    return (
      <table>
        <thead>
          <tr>
            {result.fields.map((field) => <th key={field}>{field}</th>)}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {result.fields.map((field) => (
                <td key={`${rowIndex}-${field}`}>{JSON.stringify(row[field])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container">
      <div className="editor-container">
        <CodeMirror
          value={sqlQuery}
          height="150px"
          extensions={[sql()]}
          theme={vscodeDark}
          onChange={handleQueryChange}
        />
        <button onClick={executeQuery}>Execute</button>
      </div>
      {error && <div className="error-container">{error}</div>}
      <div className="result-container">{renderTable()}</div>
      <style>{`
        .container { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); }
        .editor-container { padding: 10px; position: relative; }
        .error-container { padding: 10px; color: red; }
        .result-container { flex-grow: 1; overflow: auto; padding: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid var(--vscode-panel-border); padding: 8px; text-align: left; }
        th { background-color: var(--vscode-side-bar-background); }
        button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 4px 8px; margin-top: 5px; }
        button:hover { background-color: var(--vscode-button-hover-background); }
      `}</style>
    </div>
  );
};

export default SQLQueryView;
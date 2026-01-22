import React, { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeApi } from '../../vscode';
import { useVSCodeMessage } from '../../hooks/useVSCodeMessage';

interface QueryResult {
    rows: any[];
    fields: string[];
}

const SQLQueryView: React.FC = () => {
    const [sqlQuery, setSqlQuery] = useState((window as any).initialQuery || 'SELECT * FROM your_table LIMIT 100;');
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

    useVSCodeMessage({
        queryResult: (message) => setResult(message.result),
        queryError: (message) => setError(message.error),
    });

    const renderTable = () => {
        if (!result || result.rows.length === 0) return <p>No results to display.</p>;

        return (
            <div className="table-wrapper">
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
            </div>
        );
    };

    return (
        <div className="query-container">
            <div className="editor-section">
                <CodeMirror
                    value={sqlQuery}
                    height="200px"
                    extensions={[sql()]}
                    theme={vscodeDark}
                    onChange={handleQueryChange}
                />
                <div className="toolbar">
                    <button className="primary" onClick={executeQuery}>Run Query</button>
                    <button className="secondary" onClick={() => {
                        vscodeApi.postMessage({ command: 'saveQuery', query: sqlQuery });
                    }} style={{ marginLeft: '8px' }}>Save</button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="result-section">
                {renderTable()}
            </div>

            <style>{`
        .query-container { 
          display: flex; 
          flex-direction: column; 
          height: 100vh; 
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        .editor-section { padding: 10px; border-bottom: 1px solid var(--vscode-panel-border); }
        .toolbar { margin-top: 10px; }
        .error-banner { padding: 10px; color: #f87171; background: rgba(248, 113, 113, 0.1); margin: 10px; border-radius: 4px; border: 1px solid #f87171; }
        .result-section { flex-grow: 1; overflow: auto; padding: 10px; }
        .table-wrapper { overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        th, td { border: 1px solid var(--vscode-panel-border); padding: 8px; text-align: left; }
        th { background: var(--vscode-list-hoverBackground); font-weight: 600; }
        tr:hover { background: var(--vscode-list-hoverBackground); }
        button.primary { 
          background: var(--vscode-button-background); 
          color: var(--vscode-button-foreground); 
          border: none;
          padding: 6px 12px;
          border-radius: 2px;
          cursor: pointer;
        }
        button.primary:hover { background: var(--vscode-button-hover-background); }
        button.secondary { 
          background: var(--vscode-button-secondaryBackground); 
          color: var(--vscode-button-secondaryForeground); 
          border: none;
          padding: 6px 12px;
          border-radius: 2px;
          cursor: pointer;
        }
        button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
      `}</style>
        </div>
    );
};

export default SQLQueryView;

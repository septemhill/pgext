import React, { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeApi } from '../../vscode';
import { useVSCodeMessage } from '../../hooks/useVSCodeMessage';

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

    useVSCodeMessage({
        queryResult: (message) => setResult(message.result),
        queryError: (message) => setError(message.error),
    });

    const renderResult = () => {
        if (result === null && error === null) return <p className="empty-state">No results to display.</p>;
        if (result === null) return null;

        return (
            <div className="result-code">
                <pre>
                    <code>{JSON.stringify(result, null, 2)}</code>
                </pre>
            </div>
        );
    };

    return (
        <div className="query-container">
            <div className="editor-section">
                <CodeMirror
                    value={redisCommand}
                    height="150px"
                    theme={vscodeDark}
                    onChange={handleCommandChange}
                />
                <div className="toolbar">
                    <button className="primary" onClick={executeCommand}>Run Command</button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="result-section">
                {renderResult()}
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
        .result-code { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; }
        pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; font-family: var(--vscode-editor-font-family); }
        .empty-state { opacity: 0.6; font-style: italic; }
        button.primary { 
          background: var(--vscode-button-background); 
          color: var(--vscode-button-foreground); 
          border: none;
          padding: 6px 12px;
          border-radius: 2px;
          cursor: pointer;
        }
        button.primary:hover { background: var(--vscode-button-hover-background); }
      `}</style>
        </div>
    );
};

export default RedisQueryView;

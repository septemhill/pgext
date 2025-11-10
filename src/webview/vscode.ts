import type { WebviewApi } from 'vscode-webview';

interface VsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(newState: any): void;
}

// The acquireVsCodeApi function is provided by VS Code in the webview environment.
// @ts-ignore
export const vscodeApi: WebviewApi<any> | VsCodeApi = acquireVsCodeApi();
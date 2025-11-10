const vscode = acquireVsCodeApi();
const executeButton = document.getElementById('execute-button');
const sqlEditorElement = document.getElementById('sql-editor');
const errorContainer = document.getElementById('error-container');
const resultContainer = document.getElementById('result-container');

const sqlEditor = CodeMirror.fromTextArea(sqlEditorElement, {
	mode: 'text/x-sql',
	lineNumbers: true,
	theme: 'material-darker',
	indentWithTabs: true,
	smartIndent: true,
	autofocus: true
});

executeButton.addEventListener('click', () => {
	const sql = sqlEditor.getValue();
	errorContainer.textContent = '';
	resultContainer.innerHTML = '';
	vscode.postMessage({ command: 'executeQuery', sql: sql });
});

window.addEventListener('message', event => {
	const message = event.data;
	switch (message.command) {
		case 'queryResult':
			const { rows, fields } = message.result;
			if (rows.length === 0) {
				resultContainer.textContent = 'Query executed successfully, but no rows were returned.';
				return;
			}
			const table = document.createElement('table');
			const thead = table.createTHead();
			const headerRow = thead.insertRow();

			fields.forEach(fieldName => {
				const th = document.createElement('th');
				th.textContent = fieldName;
				headerRow.appendChild(th);
			});

			const tbody = table.createTBody();
			rows.forEach(rowData => {
				const row = tbody.insertRow();
				fields.forEach(fieldName => {
					const cell = row.insertCell();
					cell.textContent = rowData[fieldName];
				});
			});
			resultContainer.appendChild(table);
			break;
		case 'queryError':
			errorContainer.textContent = message.error;
			break;
	}
});
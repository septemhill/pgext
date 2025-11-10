import React from 'react';
import ReactDOM from 'react-dom';
import AddConnection from './AddConnection';
import SQLQueryView from './SQLQueryView';

// @ts-ignore
const view = window.view;

const App: React.FC = () => {
  if (view === 'addConnection') {
    return <AddConnection />;
  }
  if (view === 'sqlQuery') {
    return <SQLQueryView />;
  }
  return <div>Unknown view</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
import React from 'react';
import ReactDOM from 'react-dom';
import AddConnectionView from './views/AddConnection/AddConnection';
import SQLQueryView from './views/Query/SQLQueryView';
import RedisQueryView from './views/Query/RedisQueryView';

// @ts-ignore
const view = window.view;

const App: React.FC = () => {
  if (view === 'addConnection') {
    return <AddConnectionView />;
  }
  if (view === 'sqlQuery') {
    return <SQLQueryView />;
  }
  if (view === 'redisQuery') {
    return <RedisQueryView />;
  }
  return <div style={{ padding: '20px' }}>Unknown view: {view}</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
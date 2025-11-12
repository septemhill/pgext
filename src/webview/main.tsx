import React from 'react';
import ReactDOM from 'react-dom';
import AddConnection from './AddConnection';
import SQLQueryView from './SQLQueryView';
import RedisQueryView from './RedisQueryView';

// @ts-ignore
const view = window.view;

const App: React.FC = () => {
  if (view === 'addConnection') {
    return <AddConnection />;
  }
  if (view === 'sqlQuery') {
    return <SQLQueryView />;
  }
  if (view === 'redisQuery') {
    return <RedisQueryView />;
  }
  return <div>Unknown view</div>;
};

ReactDOM.render(<App />, document.getElementById('root'));
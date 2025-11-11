import React from 'react';

interface PostgresConnectionFormProps {
  alias: string;
  setAlias: (val: string) => void;
  host: string;
  setHost: (val: string) => void;
  port: string;
  setPort: (val: string) => void;
  user: string;
  setUser: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  database: string;
  setDatabase: (val: string) => void;
}

const renderInput = (id: string, label: string, value: string, onChange: (val: string) => void, type = 'text') => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const PostgresConnectionForm: React.FC<PostgresConnectionFormProps> = ({
  alias, setAlias,
  host, setHost,
  port, setPort,
  user, setUser,
  password, setPassword,
  database, setDatabase,
}) => (
  <>
    {renderInput('alias', 'Alias', alias, setAlias)}
    {renderInput('host', 'Host', host, setHost)}
    {renderInput('port', 'Port', port, setPort, 'number')}
    {renderInput('user', 'User', user, setUser)}
    {renderInput('password', 'Password', password, setPassword, 'password')}
    {renderInput('database', 'Database', database, setDatabase)}
  </>
);

export default PostgresConnectionForm;
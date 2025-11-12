import React from 'react';

interface RedisConnectionFormProps {
  alias: string;
  setAlias: (val: string) => void;
  host: string;
  setHost: (val: string) => void;
  port: string;
  setPort: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

const renderInput = (id: string, label: string, value: string, onChange: (val: string) => void, type = 'text') => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const RedisConnectionForm: React.FC<RedisConnectionFormProps> = ({
  alias, setAlias,
  host, setHost,
  port, setPort,
  password, setPassword,
}) => (
  <>
    {renderInput('alias', 'Alias', alias, setAlias)}
    {renderInput('host', 'Host', host, setHost)}
    {renderInput('port', 'Port', port, setPort, 'number')}
    {renderInput('password', 'Password', password, setPassword, 'password')}
  </>
);

export default RedisConnectionForm;
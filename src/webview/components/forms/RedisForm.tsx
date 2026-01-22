import React from 'react';

interface RedisConnectionFormProps {
    alias: string; setAlias: (v: string) => void;
    host: string; setHost: (v: string) => void;
    port: string; setPort: (v: string) => void;
    password: string; setPassword: (v: string) => void;
}

const RedisForm: React.FC<RedisConnectionFormProps> = ({
    alias, setAlias, host, setHost, port, setPort, password, setPassword
}) => {
    return (
        <>
            <div className="form-group">
                <label htmlFor="alias">Alias</label>
                <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="My Redis Cache" />
            </div>
            <div className="form-group">
                <label htmlFor="host">Host</label>
                <input id="host" type="text" value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="port">Port</label>
                <input id="port" type="text" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
        </>
    );
};

export default RedisForm;

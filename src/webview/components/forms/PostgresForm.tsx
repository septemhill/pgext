import React from 'react';

interface PostgresConnectionFormProps {
    alias: string; setAlias: (v: string) => void;
    host: string; setHost: (v: string) => void;
    port: string; setPort: (v: string) => void;
    user: string; setUser: (v: string) => void;
    password: string; setPassword: (v: string) => void;
    database: string; setDatabase: (v: string) => void;
}

const PostgresForm: React.FC<PostgresConnectionFormProps> = ({
    alias, setAlias, host, setHost, port, setPort, user, setUser, password, setPassword, database, setDatabase
}) => {
    return (
        <>
            <div className="form-group">
                <label htmlFor="alias">Alias</label>
                <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="My Postgres DB" />
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
                <label htmlFor="user">User</label>
                <input id="user" type="text" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="database">Database</label>
                <input id="database" type="text" value={database} onChange={(e) => setDatabase(e.target.value)} />
            </div>
        </>
    );
};

export default PostgresForm;

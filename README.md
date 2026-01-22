# DB Extension for VS Code

A lightweight, extensible database management extension for Visual Studio Code. Supporting multiple database types with a unified, native experience.

## Features

- **Multi-Database Support**: Currently supports **PostgreSQL** and **Redis**.
- **Unified Sidebar**: A specialized view to navigate your database connections.
- **Dynamic Folders**: Sidebar contents adapt based on the database type:
  - **PostgreSQL**: Explore `Tables` and manage `Bookmarks`.
  - **Redis**: Manage query `Bookmarks`.
- **Query Editor**: Powerful webview-based editors for both SQL and Redis commands, featuring syntax highlighting and theme-awareness.
- **Bookmarks**: Save frequently used queries to a persistent `Bookmarks` folder for quick reuse.
- **Secure Storage**: Connection details are safely stored using VS Code's extension state.
- **Native UI**: Uses VS Code's built-in icons, input boxes, and theme variables for a seamless look and feel.

## Usage

1. Click on the **Postgres** activity bar icon.
2. Use the `+` button in the sidebar title to add a new connection.
3. Select your database type and fill in the details.
4. Click the **Connect** icon $(plug) to activate the connection.
5. Save your queries using the **Save** button in the query panel.

## Roadmap

Upcoming features and improvements:

- [ ] **SSH Tunneling**: Support for connecting to databases via SSH, including:
  - SSH Password authentication.
  - **SSH Private Key authentication** (Next Priority).
- [ ] **Table Data Editing**: Directly edit table rows within the UI.
- [ ] **Schema Export**: Export database schemas to SQL files.
- [ ] **Additional Database Support**: Plans to include MySQL and MongoDB.
- [ ] **Query History**: Automatically track and search through recently executed commands.

## Development

To set up the development environment:

1. Clone this repository.
2. Install dependencies: `pnpm install`
3. Build the project: `pnpm run compile`
4. Open in VS Code and press `F5` to start debugging.

## License

None for now.
QETTA Dev Panel Extension

Quick start:

1. Open this folder in VS Code.
2. Run the `Run Extension` launch configuration from the debug panel to open a new Extension Development Host.
3. In the new VS Code window, open the `QETTA` activity bar icon -> `Dev Panel`.
4. Use 'Start Dev' to run the `npm:dev` task, and 'Copy MongoDB Conn' to copy the connection string to clipboard.

Notes:
- The extension is minimal and intends to orchestrate the local dev flow using existing tasks.
- Build the extension with `npm run compile` in `vscode-extension/` before publishing or testing.

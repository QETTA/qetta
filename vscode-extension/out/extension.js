"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    const provider = {
        resolveWebviewView(webviewView) {
            webviewView.webview.options = { enableScripts: true };
            webviewView.webview.html = getHtml();
            webviewView.webview.onDidReceiveMessage(async (msg) => {
                if (msg.command === 'startDev') {
                    await vscode.commands.executeCommand('workbench.action.tasks.runTask', 'npm:dev');
                }
                else if (msg.command === 'copyConn') {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
                    const envPath = workspaceFolder ? workspaceFolder + '/.env' : undefined;
                    // Prefer MONGODB_URI_LOCAL if present
                    const conn = process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI || 'mongodb://mongo:27017/qetta';
                    await vscode.env.clipboard.writeText(conn);
                    vscode.window.showInformationMessage('MongoDB connection string copied to clipboard');
                }
            });
        }
    };
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('qettaPanel', provider));
}
function deactivate() { }
function getHtml() {
    return `
  <!doctype html>
  <html>
    <body>
      <h3>QETTA Dev Panel</h3>
      <p>Status: <span id="status">Not checked</span></p>
      <button onclick="startDev()">Start Dev</button>
      <button onclick="copyConn()">Copy MongoDB Conn</button>
      <script>
        const vscode = acquireVsCodeApi();
        function startDev(){ vscode.postMessage({command:'startDev'}); }
        function copyConn(){ vscode.postMessage({command:'copyConn'}); }
      </script>
    </body>
  </html>
  `;
}
//# sourceMappingURL=extension.js.map
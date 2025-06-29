const vscode = require("vscode");
const path = require("path");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "DoNest.addTodo",
    async () => {
      const task = await vscode.window.showInputBox({
        prompt: "Enter your task",
      });
      if (task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage(
            "No active editor found. Please open a file to add a TODO."
          );
          return;
        }
        const document = editor.document;
        if (document.isUntitled) {
          vscode.window.showWarningMessage(
            "Please save the file before adding a TODO."
          );
          return;
        }
        const filePath = document.uri.fsPath;
        const todos = context.globalState.get("donestTodos", []);
        const exists = todos.some(
          (todo) => todo.task === task && todo.filePath === filePath
        );
        if (exists) {
          vscode.window.showWarningMessage(
            "This task already exists for this file."
          );
          return;
        }
        const todoObj = { task, filePath };
        todos.push(todoObj);
        context.globalState.update("donestTodos", todos);
        DoNestViewProvider.updateAllWebviews();
        vscode.window.showInformationMessage(`Added TODO: ${task}`);
      }
    }
  );

  context.subscriptions.push(disposable);

  let showTodosDisposable = vscode.commands.registerCommand(
    "DoNest.ShowTodos",
    async () => {
      const todos = context.globalState.get("donestTodos", []);
      if (todos.length > 0) {
        const items = todos.map((todo) =>
          typeof todo === "string" ? todo : `${todo.task} (${todo.filePath})`
        );
        vscode.window.showQuickPick(items, {
          placeHolder: "Your saved TODOs:",
        });
      } else {
        vscode.window.showInformationMessage(
          "No TODOs found in settings.json."
        );
      }
    }
  );

  context.subscriptions.push(showTodosDisposable);
  let removeTodosDisposable = vscode.commands.registerCommand(
    "DoNest.RemoveTodos",
    async () => {
      const todos = context.globalState.get("donestTodos", []);
      if (todos.length > 0) {
        const items = todos.map((todo) =>
          typeof todo === "string" ? todo : `${todo.task} (${todo.filePath})`
        );
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a TODO to remove:",
        });
        if (selected) {
          const updatedTodos = todos.filter((todo) => {
            if (typeof todo === "string") {
              return todo !== selected;
            } else {
              return `${todo.task} (${todo.filePath})` !== selected;
            }
          });
          context.globalState.update("donestTodos", updatedTodos);
          DoNestViewProvider.updateAllWebviews();
          vscode.window.showInformationMessage(`Removed TODO: ${selected}`);
        }
      } else {
        vscode.window.showInformationMessage("No TODOs found to remove.");
      }
    }
  );
  context.subscriptions.push(removeTodosDisposable);
  let clearTodosDisposable = vscode.commands.registerCommand(
    "DoNest.ClearTodos",
    async () => {
      const todos = context.globalState.get("donestTodos", []);
      if (todos.length > 0) {
        const confirmation = await vscode.window.showWarningMessage(
          "Are you sure you want to clear all TODOs?",
          { modal: true },
          "Yes",
          "No"
        );
        if (confirmation === "Yes") {
          context.globalState.update("donestTodos", []);
          DoNestViewProvider.updateAllWebviews();
          vscode.window.showInformationMessage("All TODOs cleared.");
        }
      } else {
        vscode.window.showInformationMessage("No TODOs found to clear.");
      }
    }
  );
  context.subscriptions.push(clearTodosDisposable);
  let selectTodosDisposable = vscode.commands.registerCommand(
    "DoNest.SelectTodos",
    async () => {
      const todos = context.globalState.get("donestTodos", []);
      if (todos.length > 0) {
        const items = todos.map((todo) =>
          typeof todo === "string" ? todo : `${todo.task} (${todo.filePath})`
        );
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a TODO to open its file:",
        });
        if (selected) {
          let selectedTodo = todos.find((todo) => {
            if (typeof todo === "string") {
              return todo === selected;
            } else {
              return `${todo.task} (${todo.filePath})` === selected;
            }
          });
          let filePath = undefined;
          if (typeof selectedTodo !== "string" && selectedTodo) {
            filePath = selectedTodo.filePath;
          }
          if (filePath) {
            const FolderUrl = path.dirname(filePath);
            vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.file(FolderUrl),
              false
            );
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc, { preview: false });
            vscode.window.showInformationMessage(
              `Opened file for TODO: ${selectedTodo.task}`
            );
          } else {
            vscode.window.showInformationMessage(
              "No file path found for this TODO."
            );
          }
        }
      } else {
        vscode.window.showInformationMessage("No TODOs found to select.");
      }
    }
  );
  context.subscriptions.push(selectTodosDisposable);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "donestView",
      new DoNestViewProvider(context)
    )
  );
}
class DoNestViewProvider {
  static currentViewProvider = null;

  constructor(context) {
    this.context = context;
    this._view = undefined;
    DoNestViewProvider.currentViewProvider = this;
  }

  static updateAllWebviews() {
    if (DoNestViewProvider.currentViewProvider) {
      DoNestViewProvider.currentViewProvider.sendTodos();
    }
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "addTask") {
        const task = message.text;
        if (!task) return;
        const todos = this.context.globalState.get("donestTodos", []);
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage(
            "No active editor found. Please open a file to add a TODO."
          );
          return;
        }
        const document = editor.document;
        if (document.isUntitled) {
          vscode.window.showWarningMessage(
            "Please save the file before adding a TODO."
          );
          return;
        }
        const filePath = document.uri.fsPath;
        const exists = todos.some(
          (todo) => todo.task === task && todo.filePath === filePath
        );
        if (!exists) {
          const todoObj = { task, filePath };
          todos.push(todoObj);
          await this.context.globalState.update("donestTodos", todos);
        }
        this.sendTodos();
      } else if (message.command === "getTodos") {
        this.sendTodos();
      } else if (message.command === "openTask") {
        const todos = this.context.globalState.get("donestTodos", []);
        const selectedTodo = todos.find((todo) => todo.task === message.text);
        if (selectedTodo && selectedTodo.filePath) {
          const FolderUrl = require("path").dirname(selectedTodo.filePath);
          await vscode.commands.executeCommand(
            "vscode.openFolder",
            vscode.Uri.file(FolderUrl),
            false
          );
          const doc = await vscode.workspace.openTextDocument(
            selectedTodo.filePath
          );
          await vscode.window.showTextDocument(doc, { preview: false });
          vscode.window.showInformationMessage(
            `Opened file for TODO: ${selectedTodo.task}`
          );
        } else {
          vscode.window.showInformationMessage(
            "No file path found for this TODO."
          );
        }
      }
    });
  }

  sendTodos() {
    if (!this._view) return;
    const todos = this.context.globalState.get("donestTodos", []);
    const tasks = todos.map((todo) => todo.task);
    this._view.webview.postMessage({ command: "setTodos", tasks });
  }

  getHtml() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        :root {
          color-scheme: light dark;
        }
        body {
          font-family: var(--vscode-font-family, sans-serif);
          background: var(--vscode-editor-background, #1e1e1e);
          color: var(--vscode-editor-foreground, #d4d4d4);
          padding: 16px 18px 12px 18px;
          margin: 0;
        }
        h2 {
          margin-top: 0;
          margin-bottom: 18px;
          font-size: 1.3em;
          color: var(--vscode-sideBarTitle-foreground, #fff);
          letter-spacing: 0.5px;
        }
        .input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }
        #taskInput {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--vscode-input-border, #333);
          background: var(--vscode-input-background, #232323);
          color: var(--vscode-input-foreground, #fff);
          font-size: 1em;
          outline: none;
          transition: border 0.2s;
        }
        #taskInput:focus {
          border: 1.5px solid var(--vscode-focusBorder, #0078d4);
        }
        #addBtn {
          background: var(--vscode-button-background, #0e639c);
          color: var(--vscode-button-foreground, #fff);
          border: none;
          border-radius: 6px;
          padding: 8px 18px;
          font-size: 1em;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        #addBtn:hover {
          background: var(--vscode-button-hoverBackground, #1177bb);
        }
        #taskList {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .task-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--vscode-list-inactiveSelectionBackground, #222c37);
          color: var(--vscode-list-foreground, #fff);
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 1em;
          transition: background 0.2s;
        }
        .task-item:hover {
          background: var(--vscode-list-hoverBackground, #2a3545);
        }
        .task-icon {
          color: var(--vscode-icon-foreground, #c5c5c5);
          font-size: 1.1em;
          margin-right: 2px;
        }
        li{
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="input-row">
        <input type="text" id="taskInput" placeholder="Add a task" autocomplete="off" />
        <button id="addBtn">Add</button>
      </div>
      <ul id="taskList"></ul>
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('addBtn').onclick = function() {
          const input = document.getElementById('taskInput');
          if (input.value.trim()) {
            vscode.postMessage({ command: 'addTask', text: input.value.trim() });
            input.value = '';
          }
        };
        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'setTodos') {
            const list = document.getElementById('taskList');
            list.innerHTML = '';
            message.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = '<span class=task-icon>✔️</span> <span>'+task+'</span>';
            li.onclick = function() {
              vscode.postMessage({ command: 'openTask', text: task });
            };
            list.appendChild(li);
          });
          }
        });
        vscode.postMessage({ command: 'getTodos' });
      </script>
    </body>
    </html>
  `;
  }
}

module.exports = {
  activate,
};

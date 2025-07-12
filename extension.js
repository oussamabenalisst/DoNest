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
  let RenameTodosDisposable = vscode.commands.registerCommand(
    "DoNest.RenameTodos",
    async () => {
      const todos = context.globalState.get("donestTodos", []);
      if (todos.length > 0) {
        const items = todos.map((todo) =>
          typeof todo === "string" ? todo : `${todo.task} (${todo.filePath})`
        );
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a TODO to rename:",
        });
        if (selected) {
          const newName = await vscode.window.showInputBox({
            placeHolder: "Enter new name for TODO:",
          });
          if (newName) {
            let selectedTodo = todos.find((todo) => {
              if (typeof todo === "string") {
                return todo === selected;
              } else {
                return `${todo.task} (${todo.filePath})` === selected;
              }
            });
            if (selectedTodo) {
              selectedTodo.task = newName;
              await context.globalState.update("donestTodos", todos);
              DoNestViewProvider.updateAllWebviews();
              vscode.window.showInformationMessage(
                `Renamed TODO: ${selected} to ${newName}`
              );
            }
          }
        }
      } else {
        vscode.window.showInformationMessage("No TODOs found to rename.");
      }
    }
  );
  context.subscriptions.push(RenameTodosDisposable);
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
        if (!task || task == "") {
          vscode.window.showWarningMessage("input is empty");
          return;
        }
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
        } else {
          vscode.window.showWarningMessage(
            "This task already exists for this file."
          );
          return;
        }
        this.sendTodos();
      } else if (message.command === "getTodos") {
        this.sendTodos();
      } else if (message.command === "editTask") {
        const todos = this.context.globalState.get("donestTodos", []);
        const selectedTodo = todos.find((todo) => todo.task === message.text);

        if (selectedTodo) {
          const newName = await vscode.window.showInputBox({
            value: selectedTodo.task,
            prompt: "Enter new name for the task",
            placeHolder: "New task name",
          });

          if (newName && newName.trim()) {
            selectedTodo.task = newName.trim();
            await this.context.globalState.update("donestTodos", todos);
            this.sendTodos();
            vscode.window.showInformationMessage(`Renamed task to: ${newName}`);
          }
        }
      } else if (message.command === "deleteTask") {
        const todos = this.context.globalState.get("donestTodos", []);
        const updatedTodos = todos.filter((todo) => todo.task !== message.text);
        await this.context.globalState.update("donestTodos", updatedTodos);
        this.sendTodos();
        vscode.window.showInformationMessage(`Removed TODO: ${message.text}`);
      } else if (message.command === "clearTasks") {
        const todos = this.context.globalState.get("donestTodos", []);
        if (todos.length === 0) {
          vscode.window.showWarningMessage("No tasks to clear!");
          return;
        }
        const confirmation = await vscode.window.showWarningMessage(
          "Are you sure you want to clear all TODOs?",
          { modal: true },
          "Yes",
          "No"
        );
        if (confirmation === "Yes") {
          await this.context.globalState.update("donestTodos", []);
          this.sendTodos();
          vscode.window.showInformationMessage("All TODOs cleared.");
        }
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
          padding: 12px;
          margin: 0;
        }
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 8px;
        }
        .input-row {
          display: flex;
          align-items: stretch;
          gap: 6px;
          margin-bottom: 8px;
          width: 100%;
          min-width: 0;
        }
        .button-row {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          width: 100%;
        }
        #taskInput {
          flex: 1;
          min-width: 0;
          height: 28px;
          padding: 0 8px;
          border-radius: 4px;
          border: 1px solid var(--vscode-input-border, #333);
          background: var(--vscode-input-background, #232323);
          color: var(--vscode-input-foreground, #fff);
          font-size: 13px;
          outline: none;
          transition: border 0.2s;
        }
        #taskInput:focus {
          border: 1px solid var(--vscode-focusBorder, #0078d4);
        }
        #addBtn {
          height: 28px;
          white-space: nowrap;
          padding: 0 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--vscode-button-background, #0e639c);
          color: var(--vscode-button-foreground, #fff);
          flex-shrink: 0;
        }
        #clearAllBtn {
          width: 100%;
          height: 28px;
          padding: 0 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--vscode-button-secondaryBackground, #8B0000);
          color: var(--vscode-button-foreground, #fff);
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
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 4px;
          font-size: 13px;
          transition: background 0.2s;
          position: relative;
        }
        .task-item:hover {
          background: var(--vscode-list-hoverBackground, #2a3545);
        }
        .task-icon {
          color: var(--vscode-icon-foreground, #c5c5c5);
          font-size: 14px;
        }
        .task-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 20px;
          margin-right: 60px;
        }
        .task-actions {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .task-item:hover .task-actions {
          opacity: 1;
        }
        .edit-btn, .delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: transparent;
          border: none;
          color: var(--vscode-icon-foreground, #c5c5c5);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        .edit-btn:hover {
          background: var(--vscode-button-background, #0e639c);
          color: white;
          transform: translateY(-1px);
        }
        .delete-btn:hover {
          background: var(--vscode-button-secondaryBackground, #8B0000);
          color: white;
          transform: translateY(-1px);
        }
        li {
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="input-row">
          <input type="text" id="taskInput" placeholder="Add a task" autocomplete="off" />
          <button id="addBtn">Add</button>
        </div>
        <div class="button-row">
          <button id="clearAllBtn">Clear All</button>
        </div>
        <ul id="taskList"></ul>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('addBtn').onclick = function() {
          const input = document.getElementById('taskInput');
          if (input.value.trim()) {
            vscode.postMessage({ command: 'addTask', text: input.value.trim() });
            input.value = '';
          }
        };

        document.getElementById('clearAllBtn').onclick = function() {
          vscode.postMessage({ command: 'clearTasks' });
        };

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'setTodos') {
            const list = document.getElementById('taskList');
            list.innerHTML = '';
            message.tasks.forEach(task => {
              const li = document.createElement('li');
              li.className = 'task-item';
              li.innerHTML = \`
                <span class="task-icon">✔️</span>
                <span class="task-text">\${task}</span>
                <div class="task-actions">
                  <button class="edit-btn">✏️</button>
                  <button class="delete-btn">❌</button>
                </div>
              \`;
              
              li.querySelector('.task-text').onclick = function() {
                vscode.postMessage({ command: 'openTask', text: task });
              };
              
              li.querySelector('.edit-btn').onclick = function(e) {
                e.stopPropagation();
                vscode.postMessage({ command: 'editTask', text: task });
              };

              li.querySelector('.delete-btn').onclick = function(e) {
                e.stopPropagation();
                vscode.postMessage({ command: 'deleteTask', text: task });
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

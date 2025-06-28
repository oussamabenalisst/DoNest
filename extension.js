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
  constructor(context) {
    this.context = context;
  }

  resolveWebviewView(webviewView) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();
  }

  getHtml() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; padding: 10px; }
          button { margin-top: 10px; }
        </style>
      </head>
      <body>
        <h2>📋 DoNest</h2>
        <input type="text" id="taskInput" placeholder="Add a task" />
        <button onclick="addTask()">Add</button>
        <ul id="taskList"></ul>
        <script>
          function addTask() {
            const input = document.getElementById('taskInput');
            const list = document.getElementById('taskList');
            const li = document.createElement('li');
            li.textContent = input.value;
            list.appendChild(li);
            input.value = '';
          }
        </script>
      </body>
      </html>
    `;
  }
}

module.exports = {
  activate,
};

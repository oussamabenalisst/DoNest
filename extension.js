const vscode = require("vscode");

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
        const filePath = editor ? editor.document.uri.fsPath : "";
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
        vscode.window.showInformationMessage(`Added TODO: ${task}`);
        context.globalState.update("donestTodos", todos);
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, `${task}\n`);
          });
        }
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
          typeof todo === "string" ? todo : `${todo.task}`
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
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

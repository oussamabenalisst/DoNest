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
        const todos = context.globalState.get("donestTodos", []);
        if (todos.includes(task)) {
          vscode.window.showWarningMessage("This task already exists.");
          return;
        }
        todos.push(`${task}`);
        vscode.window.showInformationMessage(`Added TODO: ${task}`);
        context.globalState.update("donestTodos", todos);
        const editor = vscode.window.activeTextEditor;
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
        vscode.window.showQuickPick(todos, {
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
        const selectedTodo = await vscode.window.showQuickPick(todos, {
          placeHolder: "Select a TODO to remove:",
        });
        if (selectedTodo) {
          const updatedTodos = todos.filter((todo) => todo !== selectedTodo);
          context.globalState.update("donestTodos", updatedTodos);
          vscode.window.showInformationMessage(`Removed TODO: ${selectedTodo}`);
        }
      } else {
        vscode.window.showInformationMessage("No TODOs found to remove.");
      }
    }
  );
  context.subscriptions.push(removeTodosDisposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

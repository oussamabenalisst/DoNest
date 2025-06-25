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
        todos.push(`${task}`);
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
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

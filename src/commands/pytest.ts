import { commands, ExtensionContext, Terminal, Uri, window, workspace } from 'coc.nvim';

import path from 'path';

import { existsPythonImportModule, getCurrentPythonPaths } from '../common';
import * as testFrameworkParser from '../parsers/testFramework';

let terminal: Terminal | undefined;

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('pyright-tools.pytest.fileTest', pytestFileTestCommand()),
    commands.registerCommand('pyright-tools.pytest.singleTest', pytestSingleTestCommand())
  );
}

async function runPytest(moduleFilePath: string, functionFormatPath?: string) {
  const pythonPaths = getCurrentPythonPaths();
  if (pythonPaths) {
    const pythonPath = pythonPaths.env;
    const existsPytest = await existsPythonImportModule(pythonPaths.env, 'pytest');
    if (!existsPytest) {
      return window.showErrorMessage('pytest does not exist!');
    }

    if (terminal) {
      if (terminal.bufnr) {
        await workspace.nvim.command(`bd! ${terminal.bufnr}`);
      }
      terminal.dispose();
      terminal = undefined;
    }

    terminal = await window.createTerminal({ name: 'pytest', cwd: workspace.root });
    const args: string[] = [];
    const pytestArgs = workspace.getConfiguration('pyright-tools').get<string[]>('test.pytestArgs');
    if (pytestArgs) {
      if (Array.isArray(pytestArgs)) {
        args.push(...pytestArgs);
      }
    }

    if (moduleFilePath && functionFormatPath) {
      // MEMO: pytest is string concatenation with ::
      const testArgsFormatPath = moduleFilePath + '::' + functionFormatPath;
      args.push(`${testArgsFormatPath}`);
      terminal.sendText(`${pythonPath} -m pytest ${args.join(' ')}`);
    } else if (moduleFilePath) {
      const testArgsFormatPath = moduleFilePath;
      args.push(`${testArgsFormatPath}`);
      terminal.sendText(`${pythonPath} -m pytest ${args.join(' ')}`);
    }

    const enableSplitRight = workspace.getConfiguration('pyright-tools').get('terminal.enableSplitRight', false);

    if (enableSplitRight) terminal.hide();
    await workspace.nvim.command('stopinsert');
    if (enableSplitRight) {
      await workspace.nvim.command(`vert bel sb ${terminal.bufnr}`);
      await workspace.nvim.command(`wincmd p`);
    }
  } else {
    return window.showErrorMessage('python3/python not found!');
  }
}

export function pytestFileTestCommand() {
  return async () => {
    const { document } = await workspace.getCurrentState();

    const fileName = path.basename(Uri.parse(document.uri).fsPath);
    if (document.languageId !== 'python' || (!fileName.startsWith('test_') && !fileName.endsWith('_test.py'))) {
      return window.showErrorMessage('This file is not a python test file!');
    }

    const fileUri = document.uri;
    const workspaceUri = Uri.parse(workspace.root).toString();
    const relativeFileUri = fileUri.replace(workspaceUri + '/', '');

    // MEMO: file path (not unittest module format path)
    const testModuleFilePath = relativeFileUri.split('/').join(path.sep);

    runPytest(testModuleFilePath);
  };
}

export function pytestSingleTestCommand() {
  return async () => {
    const { document, position } = await workspace.getCurrentState();

    const fileName = path.basename(Uri.parse(document.uri).fsPath);
    if (document.languageId !== 'python' || (!fileName.startsWith('test_') && !fileName.endsWith('_test.py'))) {
      return window.showErrorMessage('This file is not a python test file!');
    }

    const fileUri = document.uri;
    const workspaceUri = Uri.parse(workspace.root).toString();
    const relativeFileUri = fileUri.replace(workspaceUri + '/', '');

    // MEMO: file path (not unittest module format path)
    const testModuleFilePath = relativeFileUri.split('/').join(path.sep);

    const parsed = testFrameworkParser.parse(document.getText());
    if (!parsed) return;
    const walker = new testFrameworkParser.TestFrameworkWalker('pytest');
    walker.walk(parsed.parseTree);

    let testFunctionFormatPath: string | undefined = undefined;
    for (const item of walker.featureItems) {
      const itemStartPostion = document.positionAt(item.startOffset);
      const itemEndPostion = document.positionAt(item.endOffset);
      if (position.line >= itemStartPostion.line && position.line <= itemEndPostion.line) {
        testFunctionFormatPath = item.value;
      }
    }

    if (testFunctionFormatPath) {
      runPytest(testModuleFilePath, testFunctionFormatPath);
    } else {
      window.showErrorMessage(`Test not found`);
    }
  };
}

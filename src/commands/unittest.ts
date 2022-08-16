import { commands, ExtensionContext, Terminal, Uri, window, workspace } from 'coc.nvim';

import path from 'path';

import { getCurrentPythonPaths } from '../common';
import * as testFrameworkParser from '../parsers/testFramework';

let terminal: Terminal | undefined;

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('pyright-tools.unittest.fileTest', unittestFileTestCommand()),
    commands.registerCommand('pyright-tools.unittest.singleTest', unittestSingleTestCommand())
  );
}

async function runUnittest(moduleFormatPath: string, functionFormatPath?: string) {
  const pythonPaths = getCurrentPythonPaths();
  if (pythonPaths) {
    const pythonPath = pythonPaths.env;
    if (terminal) {
      if (terminal.bufnr) {
        await workspace.nvim.command(`bd! ${terminal.bufnr}`);
      }
      terminal.dispose();
      terminal = undefined;
    }

    terminal = await window.createTerminal({ name: 'unittest', cwd: workspace.root });
    const args: string[] = [];
    const unittestArgs = workspace.getConfiguration('pyright-tools').get<string[]>('test.unittestArgs');
    if (unittestArgs) {
      if (Array.isArray(unittestArgs)) {
        args.push(...unittestArgs);
      }
    }

    if (moduleFormatPath && functionFormatPath) {
      // MEMO: unittest is string concatenation with '.'
      const testArgsFormatPath = moduleFormatPath + '.' + functionFormatPath;
      args.push(`${testArgsFormatPath}`);
      terminal.sendText(`${pythonPath} -m unittest ${args.join(' ')}`);
    } else if (moduleFormatPath) {
      const testArgsFormatPath = moduleFormatPath;
      args.push(`${testArgsFormatPath}`);
      terminal.sendText(`${pythonPath} -m unittest ${args.join(' ')}`);
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

export function unittestFileTestCommand() {
  return async () => {
    const { document } = await workspace.getCurrentState();

    const fileName = path.basename(Uri.parse(document.uri).fsPath);
    if (document.languageId !== 'python' || (!fileName.startsWith('test_') && !fileName.endsWith('_test.py'))) {
      return window.showErrorMessage('This file is not a python test file!');
    }

    const fileUri = document.uri;
    const workspaceUri = Uri.parse(workspace.root).toString();
    const relativeFileUri = fileUri.replace(workspaceUri + '/', '');
    const testModuleFormatPath = relativeFileUri.replace(/.py$/, '').split('/').join('.');

    runUnittest(testModuleFormatPath);
  };
}

export function unittestSingleTestCommand() {
  return async () => {
    const { document, position } = await workspace.getCurrentState();

    const fileName = path.basename(Uri.parse(document.uri).fsPath);
    if (document.languageId !== 'python' || (!fileName.startsWith('test_') && !fileName.endsWith('_test.py'))) {
      return window.showErrorMessage('This file is not a python test file!');
    }

    const fileUri = document.uri;
    const workspaceUri = Uri.parse(workspace.root).toString();
    const relativeFileUri = fileUri.replace(workspaceUri + '/', '');
    const testModuleFormatPath = relativeFileUri.replace(/.py$/, '').split('/').join('.');

    const parsed = testFrameworkParser.parse(document.getText());
    if (!parsed) return;
    const walker = new testFrameworkParser.TestFrameworkWalker('unittest');
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
      runUnittest(testModuleFormatPath, testFunctionFormatPath);
    } else {
      window.showErrorMessage(`Test not found`);
    }
  };
}

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  events,
  ExtensionContext,
  languages,
  LinesTextDocument,
  Position,
  Range,
  Uri,
  workspace,
} from 'coc.nvim';

import path from 'path';

import * as testFrameworkParser from '../parsers/testFramework';

export function register(context: ExtensionContext) {
  if (workspace.getConfiguration('pyright-tools').get<boolean>('codeLens.enable', true)) {
    context.subscriptions.push(
      languages.registerCodeLensProvider([{ language: 'python', scheme: 'file' }], new TestFrameworkCodeLensProvider())
    );
  }
}

export class TestFrameworkCodeLensProvider implements CodeLensProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async provideCodeLenses(document: LinesTextDocument, token: CancellationToken) {
    const fileName = path.basename(Uri.parse(document.uri).fsPath);
    if (document.languageId !== 'python' || (!fileName.startsWith('test_') && !fileName.endsWith('_test.py'))) {
      return [];
    }

    const codeLenses: CodeLens[] = [];
    const codeLensTitle = this.getCodeLensTitle();

    // do not process codelens when in insert mode
    if (events.insertMode) return codeLenses;

    try {
      const parsed = testFrameworkParser.parse(document.getText());
      if (!parsed) return;
      const walker = this.initWalker();
      walker.walk(parsed.parseTree);

      for (const item of walker.featureItems) {
        if (item.startOffset && item.endOffset) {
          const itemStartPostion = document.positionAt(item.startOffset);
          const itemEndPostion = document.positionAt(item.endOffset);
          const codeLensCommandId = this.getCodeLensCommand();

          const lens: CodeLens = {
            range: Range.create(
              Position.create(itemStartPostion.line, itemStartPostion.character),
              Position.create(itemEndPostion.line, itemEndPostion.character)
            ),
            command: {
              title: codeLensTitle,
              command: codeLensCommandId,
            },
          };

          codeLenses.push(lens);
        }
      }
    } catch (e) {
      // noop
    }

    // For some reason, the virtual text does not disappear even when the
    // number of code lens goes from 1 to 0.
    //
    // It may be a bug in coc.nvim itself, but it sends code lens with Range
    // of 0 and forces a refresh.
    if (codeLenses.length === 0) {
      codeLenses.push({
        range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      });
    }

    return codeLenses;
  }

  private initWalker() {
    const codeLensTestFramework = workspace
      .getConfiguration('pyright-tools')
      .get<string>('codeLens.testFramework', 'unittest');
    const testFramework = codeLensTestFramework as testFrameworkParser.TestFramework;

    return new testFrameworkParser.TestFrameworkWalker(testFramework);
  }

  private getCodeLensTitle() {
    const testFramework = workspace.getConfiguration('pyright-tools').get<string>('codeLens.testFramework', 'unittest');

    if (testFramework === 'pytest') {
      return workspace.getConfiguration('pyright-tools').get('codeLens.pytestTitle', '>> [RUN pytest]');
    } else {
      return workspace.getConfiguration('pyright-tools').get('codeLens.unittestTitle', '>> [RUN unittest]');
    }
  }

  private getCodeLensCommand() {
    const testFramework = workspace.getConfiguration('pyright-tools').get<string>('codeLens.testFramework', 'unittest');

    if (testFramework === 'pytest') {
      return 'pyright-tools.pytest.singleTest';
    } else {
      return 'pyright-tools.unittest.singleTest';
    }
  }
}

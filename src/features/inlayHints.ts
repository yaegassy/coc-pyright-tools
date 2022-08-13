import {
  CancellationToken,
  commands,
  DocumentSelector,
  Emitter,
  Event,
  ExtensionContext,
  Hover,
  InlayHint,
  InlayHintLabelPart,
  InlayHintsProvider,
  LanguageClient,
  languages,
  LinesTextDocument,
  MarkupContent,
  Position,
  Range,
  workspace,
} from 'coc.nvim';

import * as typeInlayHintsParser from '../parsers/typeInlayHints';

export async function register(context: ExtensionContext, client: LanguageClient) {
  if (workspace.getConfiguration('pyright-tools').get('inlayHints.enable')) {
    await client.onReady();

    const documentSelector: DocumentSelector = [{ language: 'python', scheme: 'file' }];
    const typeInlayHintsProvider = new TypeInlayHintsProvider(context, client);

    context.subscriptions.push(languages.registerInlayHintsProvider(documentSelector, typeInlayHintsProvider));

    context.subscriptions.push(
      commands.registerCommand('pyright-tools.toggleInlayHints', async () => {
        await typeInlayHintsProvider.toggle();
      })
    );
  }
}

class TypeInlayHintsProvider implements InlayHintsProvider {
  private readonly _onDidChangeInlayHints = new Emitter<void>();
  public readonly onDidChangeInlayHints: Event<void> = this._onDidChangeInlayHints.event;

  private inlayHintsEnabled: boolean;
  private context: ExtensionContext;
  private client: LanguageClient;

  constructor(context: ExtensionContext, client: LanguageClient) {
    this.context = context;
    this.client = client;
    this.inlayHintsEnabled = !!workspace.getConfiguration('pyright-tools').get<boolean>('inlayHints.enable');
  }

  async provideInlayHints(
    document: LinesTextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    range: Range,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken
  ) {
    const inlayHints: InlayHint[] = [];
    if (!this.inlayHintsEnabled) return [];

    const code = document.getText();
    const parsed = typeInlayHintsParser.parse(code);
    if (!parsed) return [];

    const walker = new typeInlayHintsParser.TypeInlayHintsWalker();
    walker.walk(parsed.parseTree);

    for (const item of walker.featureItems) {
      if (this.isDisableVariableTypes(item.inlayHintType)) continue;
      if (this.isDisableFunctionReturnTypes(item.inlayHintType)) continue;

      const startPosition = document.positionAt(item.startOffset);
      const endPosition = document.positionAt(item.endOffset);
      const hoverResponse = await this.getHoverAtOffset(document, startPosition);

      if (hoverResponse) {
        let inlayHintLabelValue: string | undefined = undefined;
        let inlayHintPostion: Position | undefined = undefined;

        if (item.inlayHintType === 'variable') {
          inlayHintLabelValue = this.getVariableHintAtHover(hoverResponse);
        }

        if (item.inlayHintType === 'functionReturn') {
          inlayHintLabelValue = this.getFunctionReturnHintAtHover(hoverResponse);
        }

        if (inlayHintLabelValue) {
          const inlayHintLabelPart: InlayHintLabelPart[] = [
            {
              value: inlayHintLabelValue,
            },
          ];

          switch (item.inlayHintType) {
            case 'variable':
              inlayHintPostion = startPosition;
              break;
            case 'functionReturn':
              inlayHintPostion = endPosition;
              break;
            default:
              break;
          }

          if (inlayHintPostion) {
            const inlayHint: InlayHint = {
              label: inlayHintLabelPart,
              position: inlayHintPostion,
            };

            inlayHints.push(inlayHint);
          }
        }
      }
    }

    return inlayHints;
  }

  private async getHoverAtOffset(document: LinesTextDocument, position: Position) {
    const params = {
      textDocument: { uri: document.uri },
      position,
    };

    return await this.client.sendRequest<Hover>('textDocument/hover', params);
  }

  private getVariableHintAtHover(hover: Hover): string | undefined {
    const contents = hover.contents as MarkupContent;
    if (contents) {
      if (contents.value.includes('(variable)')) {
        const text = contents.value.split(': ')[1].split('\n')[0].trim();
        const hintText = ': ' + text;
        return hintText;
      }
    }
  }

  private getFunctionReturnHintAtHover(hover: Hover): string | undefined {
    const contents = hover.contents as MarkupContent;
    if (contents) {
      if (contents.value.includes('(function)') || contents.value.includes('(method)')) {
        const text = contents.value.split('->')[1].split('\n')[0].trim();
        const hintText = '-> ' + text;
        return hintText;
      }
    }
  }

  private isDisableVariableTypes(inlayHintType: string) {
    if (!workspace.getConfiguration('pyright-tools').get('inlayHints.variableTypes') && inlayHintType === 'variable') {
      return true;
    }
    return false;
  }

  private isDisableFunctionReturnTypes(inlayHintType: string) {
    if (
      !workspace.getConfiguration('pyright-tools').get('inlayHints.functionReturnTypes') &&
      inlayHintType === 'functionReturn'
    ) {
      return true;
    }
    return false;
  }

  async toggle() {
    if (this.inlayHintsEnabled) {
      this.inlayHintsEnabled = false;
      this._onDidChangeInlayHints.fire();
    } else {
      this.inlayHintsEnabled = true;
      this._onDidChangeInlayHints.fire();
    }
  }
}

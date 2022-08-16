import { ExtensionContext, LanguageClient, services, workspace } from 'coc.nvim';

import * as typeInlayHintsFeature from './features/inlayHints';
import * as pytestCommandFeature from './commands/pytest';
import * as unittestCommandFeature from './commands/unittest';
import * as testFrameworkCodeLensFeature from './features/codeLens';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('pyright-tools').get<boolean>('enable', true)) return;

  unittestCommandFeature.register(context);
  pytestCommandFeature.register(context);
  testFrameworkCodeLensFeature.register(context);

  const service = services.getService('pyright');
  if (service) {
    const client = service.client! as LanguageClient;
    typeInlayHintsFeature.register(context, client);
  }
}

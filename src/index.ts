import { ExtensionContext, LanguageClient, services, workspace } from 'coc.nvim';

import * as typeInlayHintsFeature from './features/inlayHints';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('pyright-tools').get<boolean>('enable', true)) return;

  const service = services.getService('pyright');
  if (service) {
    const client = service.client! as LanguageClient;
    typeInlayHintsFeature.register(context, client);
  }
}

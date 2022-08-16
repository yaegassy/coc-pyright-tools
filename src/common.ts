import { workspace } from 'coc.nvim';

import child_process from 'child_process';
import fs from 'fs';
import util from 'util';
import which from 'which';

const exec = util.promisify(child_process.exec);

export type PythonPaths = {
  env: string;
  real: string;
};

export function getCurrentPythonPaths() {
  let pythonPaths: PythonPaths | undefined;

  let pythonPath = workspace.getConfiguration('pyright-tools').get<string>('python.interpreterPath', '');
  if (pythonPath) {
    pythonPaths = {
      env: pythonPath,
      real: fs.realpathSync(pythonPath),
    };
    return pythonPaths;
  }

  try {
    pythonPath = which.sync('python3');
    pythonPaths = {
      env: pythonPath,
      real: fs.realpathSync(pythonPath),
    };
    return pythonPaths;
  } catch (e) {
    // noop
  }

  try {
    pythonPath = which.sync('python');
    pythonPaths = {
      env: pythonPath,
      real: fs.realpathSync(pythonPath),
    };
    return pythonPaths;
  } catch (e) {
    // noop
  }

  return pythonPaths;
}

export async function existsPythonImportModule(pythonPath: string, moduleName: string): Promise<boolean> {
  const checkCmd = `${pythonPath} -c "import ${moduleName}"`;
  try {
    await exec(checkCmd);
    return true;
  } catch (error) {
    return false;
  }
}

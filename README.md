# coc-pyright-tools

`coc-pyright-tools` is a coc-extension that adds its own functionality to [coc-pyright](https://github.com/fannheyward/coc-pyright) for [coc.nvim](https://github.com/neoclide/coc.nvim). Currently the **"Inlay Hints"**, Test Framework commands feature is available.

## Install

**e.g. vim-plug**:

```vim
Plug 'yaegassy/coc-pyright-tools', {'do': 'yarn install --frozen-lockfile'}
```

### Requirement

You must have [coc-pyright](https://github.com/fannheyward/coc-pyright) installed to use the features of `coc-pyright-tools`. Check the [coc-pyright](https://github.com/fannheyward/coc-pyright) repository for installation instructions.

## Features

### Inlay Hints

Pyright itself does not provide inlay hints, but implements client-based Pylance-like inlay hints feature.

Check about Pylance inlay type hints. See: <https://devblogs.microsoft.com/python/python-in-visual-studio-code-july-2022-release/#inlay-type-hints>

**DEMO (mp4)**:

https://user-images.githubusercontent.com/188642/184496855-793312d6-1bfc-4332-a64d-a625c6bba738.mp4

### (TODO) CodeLens

Running test such as `unittest`, `pytest`, etc.

## Commands

- `pyright-tools.toggleInlayHints`: Toggle enable/disable inlay hints
- `pyright-tools.unittest.fileTest`: Run unittest for current file
- `pyright-tools.unittest.singleTest`: Run unittest for single (nearest) test
- `pyright-tools.pytest.fileTest`: Run pytest for current file
- `pyright-tools.pytest.singleTest`: Run pytest for single (nearest) test

## Configuration options

- `pyright-tools.enable`: Enable coc-pyright-tools extension, default: `true`
- `pyright-tools.python.interpreterPath`: Path to the Python interpreter executable. Particularly important if you are using a Python virtual environment. Leave blank to use Python from PATH, default: `""`
- `pyright-tools.inlayHints.enable`: Enable/disable inlay hints feature, `true`
- `pyright-tools.inlayHints.functionReturnTypes`: Enable/disable inlay hints for function return types, default: `true`
- `pyright-tools.inlayHints.variableTypes`: Enable/disable inlay hints for variable types, default: `true`
- `pyright-tools.test.unittestArgs`: Arguments passed in. Each argument is a separate item in the array, default: `[]`
- `pyright-tools.test.pytestArgs`: Arguments passed in. Each argument is a separate item in the array, default: `[]`
- `pyright-tools.terminal.enableSplitRight`: Use vertical belowright for unittest/pytest terminal window, default: `false`

## Thanks

- <https://github.com/microsoft/pyright>
- <https://github.com/fannheyward/coc-pyright>
- <https://github.com/Zzzen/pyright-packager>
- <https://zzzen.github.io/pyright-ast-viewer/>

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

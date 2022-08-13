# coc-pyright-tools

`coc-pyright-tools` is a coc-extension that adds its own functionality to [coc-pyright](https://github.com/fannheyward/coc-pyright) for [coc.nvim](https://github.com/neoclide/coc.nvim). Currently the **"Inlay Hints"** feature is available.

## Install

**e.g. vim-plug**:

```vim
Plug 'yaegassy/coc-volar', {'do': 'yarn install --frozen-lockfile'}
```

### Requirement

You must have [coc-pyright](https://github.com/fannheyward/coc-pyright) installed to use the features of `coc-pyright-tools`. Check the [coc-pyright](https://github.com/fannheyward/coc-pyright) repository for installation instructions.

## Features

### Inlay Hints

Pylance-like inlay type hints. See: <https://devblogs.microsoft.com/python/python-in-visual-studio-code-july-2022-release/#inlay-type-hints>

### (TODO) CodeLens

Running test such as `unittest`, `pytest`, etc.

## Configuration options

- `pyright-tools.enable`: Enable coc-pyright-tools extension, default: `true`
- `pyright-tools.inlayHints.enable`: Enable/disable inlay hints feature, `true`
- `pyright-tools.inlayHints.functionReturnTypes`: Enable/disable inlay hints for function return types, default: `true`
- `pyright-tools.inlayHints.variableTypes`: Enable/disable inlay hints for variable types, default: `true`

## Commands

- `pyright-tools.toggleInlayHints`
  - Toggle enable/disable inlay hints

## Thanks

- <https://github.com/microsoft/pyright>
- <https://github.com/fannheyward/coc-pyright>
- <https://github.com/Zzzen/pyright-packager>
- <https://zzzen.github.io/pyright-ast-viewer/>

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

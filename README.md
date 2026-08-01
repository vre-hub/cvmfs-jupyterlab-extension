# CVMFS JupyterLab Extension

A JupyterLab extension for discovering and using software distributed through CVMFS using the Lmod module system.

## Features

- Browse software available on CVMFS directly from a JupyterLab sidebar.
- Discover software using Lmod Spider.
- Automatically detect the host platform using `archspec` and `/etc/os-release`.
- Generate Lmod modulefiles for LCG releases from `setup.sh` scripts.
- Organize LCG modules in a platform-first module tree.
- Activate software environments through Lmod.
- Create Jupyter kernels with the selected software environment.
- Support manual platform selection and platform-aware software discovery.
- Support both generated LCG modules and existing Lmod module trees (e.g. EESSI).

## Development Environment

| Component | Version |
|----------|---------|
| Python | 3.11 |
| JupyterLab | 4.6.1 |
| Node.js | 22.20.0 |
| jlpm | 3.5.0 |
| Lmod | 9.x |
| EESSI | 2023.06 |
| Operating System | RHEL 9 (EL9) |

## Technologies

- Python
- TypeScript
- React
- JupyterLab Extension API
- Lmod
- Spider
- CVMFS
- archspec
- Lua

## Install

To install the extension, execute:

```bash
pip install cvmfs_extension
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall cvmfs_extension
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

If you would like to contribute to this extension, please refer to the [Contributing Guide](CONTRIBUTING.md).

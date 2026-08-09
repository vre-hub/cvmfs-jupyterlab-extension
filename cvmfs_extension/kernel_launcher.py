import json
import re
from pathlib import Path

from .config import LMOD_INIT, configured_paths


KERNELS_DIR = Path.home() / ".local" / "share" / "jupyter" / "kernels"


def _kernel_name(modules: list[str]) -> str:
    """Create a stable Jupyter kernel name from module names."""
    parts = []

    for module in modules:
        # LCG/107 -> lcg-107
        part = module.replace("/", "-")
        part = re.sub(r"[^a-zA-Z0-9._-]", "-", part)
        parts.append(part.lower())

    return "cvmfs-" + "-".join(parts)


def _create_launcher(
    launcher_path: Path,
    modules: list[str],
    platform: str,
) -> None:
    """Create the launcher.sh used to start the kernel."""

    paths = configured_paths(platform)

    # For now, the LCG module tree is the platform-specific
    # module tree that we explicitly add with `module use`.
    lcg_path = paths["LCG Releases"]

    lines = [
        "#!/bin/bash",
        "set -e",
        "",
        f"source {LMOD_INIT}",
        "",
        f"module use {lcg_path}",
        "",
    ]

    for module in modules:
        lines.append(f"module load {module}")

    lines.extend(
        [
            "",
            'exec python -m ipykernel_launcher "$@"',
            "",
        ]
    )

    launcher_path.write_text("\n".join(lines))
    launcher_path.chmod(0o755)


def _create_kernel_json(
    kernel_path: Path,
    launcher_path: Path,
    display_name: str,
) -> None:
    """Create the kernel.json file."""

    kernel_json = {
        "argv": [
            str(launcher_path),
            "-f",
            "{connection_file}",
        ],
        "display_name": display_name,
        "language": "python",
    }

    kernel_path.write_text(
        json.dumps(kernel_json, indent=2) + "\n"
    )


def create_kernel(
    modules: list[str],
    platform: str,
    display_name: str,
) -> str:
    """
    Create a Jupyter kernelspec that launches with the requested
    Lmod modules loaded.

    Returns the Jupyter kernel name.
    """

    if not modules:
        raise ValueError("At least one module is required")

    kernel_name = _kernel_name(modules)

    kernel_dir = KERNELS_DIR / kernel_name
    kernel_dir.mkdir(parents=True, exist_ok=True)

    launcher_path = kernel_dir / "launcher.sh"
    kernel_json_path = kernel_dir / "kernel.json"

    _create_launcher(
        launcher_path,
        modules,
        platform,
    )

    _create_kernel_json(
        kernel_json_path,
        launcher_path,
        display_name,
    )

    return kernel_name
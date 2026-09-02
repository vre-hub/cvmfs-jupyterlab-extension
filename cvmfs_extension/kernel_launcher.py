import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from .config import LMOD_INIT, configured_paths


KERNELS_DIR = (
    Path.home()
    / ".local"
    / "share"
    / "jupyter"
    / "kernels"
)


def _kernel_name(
    modules: list[str],
    platform: str,
) -> str:
    """Create a stable, platform-aware Jupyter kernel name."""

    parts = []

    platform_part = re.sub(
        r"[^a-zA-Z0-9._-]",
        "-",
        platform,
    )

    parts.append(platform_part.lower())

    for module in modules:
        # Example: LCG/107 -> lcg-107
        part = module.replace("/", "-")

        part = re.sub(
            r"[^a-zA-Z0-9._-]",
            "-",
            part,
        )

        parts.append(part.lower())

    return "cvmfs-" + "-".join(parts)


def _create_launcher(
    launcher_path: Path,
    modules: list[str],
    platform: str,
) -> None:
    """Create the launcher used to start the Jupyter kernel."""

    paths = configured_paths(platform)

    # LCG module tree for the selected platform.
    lcg_path = paths["LCG Releases"]

    # EESSI module tree.
    eessi_path = paths.get("EESSI")

    lines = [
        "#!/bin/bash",
        "set -e",
        "",
        f"source {LMOD_INIT}",
        "",
        "module purge",
        "",
    ]

    # Make the LCG module tree available.
    lines.extend(
        [
            f"module use {lcg_path}",
            "",
        ]
    )

    # If configured, also make the EESSI module tree available.
    if eessi_path:
        lines.extend(
            [
                f"module use {eessi_path}",
                "",
            ]
        )

    # Load all requested modules.
    for module in modules:
        lines.append(
            f"module load {module}"
        )

    lines.extend(
        [
            "",
            # IMPORTANT:
            # Do not use `python` here.
            #
            # After loading an EESSI module, `python` may point to
            # EESSI's Python, which may not contain ipykernel.
            #
            # sys.executable is the Python running the Jupyter
            # server/extension, i.e. the project's venv Python.
            'exec python -m ipykernel_launcher "$@"',
            "",
        ]
    )

    launcher_path.write_text(
        "\n".join(lines)
    )

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
        json.dumps(
            kernel_json,
            indent=2,
        )
        + "\n"
    )


def _create_metadata(
    kernel_path: Path,
    modules: list[str],
    platform: str,
    display_name: str,
) -> None:
    """Create metadata identifying this as an extension-managed kernel."""

    metadata = {
        "created_by": "cvmfs_extension",
        "modules": modules,
        "platform": platform,
        "display_name": display_name,
    }

    metadata_path = (
        kernel_path / "metadata.json"
    )

    metadata_path.write_text(
        json.dumps(
            metadata,
            indent=2,
        )
        + "\n"
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
        raise ValueError(
            "At least one module is required"
        )

    if not platform:
        raise ValueError(
            "Platform is required"
        )

    kernel_name = _kernel_name(
        modules,
        platform,
    )

    kernel_dir = (
        KERNELS_DIR / kernel_name
    )

    kernel_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    launcher_path = (
        kernel_dir / "launcher.sh"
    )

    kernel_json_path = (
        kernel_dir / "kernel.json"
    )

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

    _create_metadata(
        kernel_dir,
        modules,
        platform,
        display_name,
    )

    return kernel_name


def _module_available(
    module: str,
    platform: str,
) -> bool:
    """Check whether a module is available."""

    paths = configured_paths(platform)

    lcg_path = paths["LCG Releases"]

    try:
        command = (
            f"source {LMOD_INIT} && "
            f"module use {lcg_path} && "
            f"module spider {module}"
        )

        result = subprocess.run(
            [
                "bash",
                "-lc",
                command,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        return result.returncode == 0

    except Exception:
        return False


def validate_kernels() -> list[dict]:
    """Validate CVMFS extension-managed kernels."""

    results = []

    if not KERNELS_DIR.exists():
        return results

    for kernel_dir in KERNELS_DIR.glob(
        "cvmfs-*"
    ):
        metadata_path = (
            kernel_dir / "metadata.json"
        )

        # Only inspect kernels created by this extension.
        if not metadata_path.exists():
            continue

        try:
            metadata = json.loads(
                metadata_path.read_text()
            )

            modules = metadata.get(
                "modules",
                [],
            )

            platform = metadata.get(
                "platform"
            )

            available = bool(platform)

            if available:
                for module in modules:
                    if not _module_available(
                        module,
                        platform,
                    ):
                        available = False
                        break

            results.append(
                {
                    "kernel_name": kernel_dir.name,
                    "display_name": metadata.get(
                        "display_name",
                        kernel_dir.name,
                    ),
                    "modules": modules,
                    "platform": platform,
                    "available": available,
                }
            )

        except Exception as exc:
            results.append(
                {
                    "kernel_name": kernel_dir.name,
                    "available": False,
                    "error": str(exc),
                }
            )

    return results


def remove_kernel(
    kernel_name: str,
) -> None:
    """Remove a CVMFS extension-managed kernelspec."""

    if not kernel_name.startswith(
        "cvmfs-"
    ):
        raise ValueError(
            "Only CVMFS extension kernels can be removed"
        )

    kernel_dir = (
        KERNELS_DIR / kernel_name
    )

    if not kernel_dir.exists():
        raise FileNotFoundError(
            f"Kernel {kernel_name} does not exist"
        )

    metadata_path = (
        kernel_dir / "metadata.json"
    )

    if not metadata_path.exists():
        raise ValueError(
            "Kernel is not managed by the CVMFS extension"
        )

    kernel_dir_resolved = (
        kernel_dir.resolve()
    )

    kernels_root_resolved = (
        KERNELS_DIR.resolve()
    )

    if (
        kernels_root_resolved
        not in kernel_dir_resolved.parents
    ):
        raise ValueError(
            "Invalid kernel path"
        )

    shutil.rmtree(kernel_dir)
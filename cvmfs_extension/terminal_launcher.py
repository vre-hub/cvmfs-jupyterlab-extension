import shlex

from .config import LMOD_INIT, configured_paths


def build_terminal_command(
    modules: list[str],
    platform: str,
) -> list[str]:
    """Build the command used to start a CVMFS terminal."""

    if not modules:
        raise ValueError("At least one module is required")

    if not platform:
        raise ValueError("Platform is required")

    paths = configured_paths(platform)
    lcg_path = paths["LCG Releases"]

    commands = [
        f"source {shlex.quote(LMOD_INIT)}",
        "module purge",
        f"module use {shlex.quote(lcg_path)}",
    ]

    for module in modules:
        commands.append(
            f"module load {shlex.quote(module)}"
        )

    commands.append("exec bash")

    script = " && ".join(commands)

    return [
        "bash",
        "-lc",
        script,
    ]


def terminal_name(
    modules: list[str],
    platform: str,
) -> str:
    """Create a WebSocket-s afe terminal name."""

    module_text = "_".join(modules)
    safe_platform = platform.replace("-", "_")

    return f"CVMFS_{module_text.replace('/', '_')}_{safe_platform}"
from pathlib import Path
import re

import archspec.cpu


MODULE_ROOT = Path(
    "/afs/cern.ch/user/o/ojain/cvmfs_extension_backup/lcg_generator/generated_modules"
)


def detect_architecture() -> str:
    """Detect the host CPU architecture."""

    host = archspec.cpu.host()
    return host.family.name


def detect_os() -> str:
    """Detect the host operating system."""

    info = {}

    with open("/etc/os-release") as f:
        for line in f:
            if "=" not in line:
                continue

            key, value = line.rstrip().split("=", 1)
            info[key] = value.strip('"')

    major = info["VERSION_ID"].split(".")[0]
    return f"el{major}"


def detect_host() -> tuple[str, str]:
    """Return (architecture, os)."""

    return detect_architecture(), detect_os()


def available_platforms() -> list[str]:
    """Return all available platform module trees."""

    if not MODULE_ROOT.exists():
        return []

    return sorted(
        d.name
        for d in MODULE_ROOT.iterdir()
        if d.is_dir()
    )


def compatible_platforms() -> list[str]:
    """Return platform trees compatible with the current host."""

    arch, os_name = detect_host()

    prefix = f"{arch}-{os_name}-"

    return [
        platform
        for platform in available_platforms()
        if platform.startswith(prefix)
    ]


def select_default_platform() -> str | None:
    """
    Select the default compatible platform.

    Preference:
      1. Highest GCC version
      2. opt build over dbg
    """

    platforms = compatible_platforms()

    if not platforms:
        return None

    def sort_key(platform: str):
        match = re.search(r"gcc(\d+)", platform)
        gcc_version = int(match.group(1)) if match else 0

        is_opt = platform.endswith("-opt")

        return (gcc_version, is_opt)

    return max(platforms, key=sort_key)


if __name__ == "__main__":
    print("Architecture:", detect_architecture())
    print("OS:", detect_os())

    print("\nAvailable platforms:")
    for p in available_platforms():
        print(" ", p)

    print("\nCompatible platforms:")
    for p in compatible_platforms():
        print(" ", p)

    print("\nSelected default:")
    print(" ", select_default_platform())
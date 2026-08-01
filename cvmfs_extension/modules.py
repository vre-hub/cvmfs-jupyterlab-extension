from pathlib import Path

MODULE_ROOT = Path(
    "/afs/cern.ch/user/o/ojain/cvmfs_extension_backup/lcg_generator/generated_modules"
)


def releases() -> list[str]:
    """Return all generated LCG releases."""

    if not MODULE_ROOT.exists():
        return []

    return sorted(
        d.name
        for d in MODULE_ROOT.iterdir()
        if d.is_dir()
    )


def platforms(release: str) -> list[str]:
    """Return all platforms for a release."""

    release_dir = MODULE_ROOT / release

    if not release_dir.exists():
        return []

    return sorted(
        f.stem
        for f in release_dir.glob("*.lua")
    )
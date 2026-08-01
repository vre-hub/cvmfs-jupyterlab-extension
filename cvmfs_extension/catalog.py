import json
import os
import subprocess

from .modules import platforms
from .platform import choose_platform

def get_spider_path() -> str:
    """
    Locate the Lmod spider executable using LMOD_CMD.
    """

    lmod_cmd = os.environ.get("LMOD_CMD")

    if not lmod_cmd:
        raise RuntimeError(
            "LMOD_CMD is not set. Did you source the Lmod init script?"
        )

    spider_path = os.path.join(
        os.path.dirname(lmod_cmd),
        "spider",
    )

    if not os.path.exists(spider_path):
        raise RuntimeError(
            f"Spider executable not found:\n{spider_path}"
        )

    return spider_path


def get_catalog(module_path: str | None = None):
    """
    Run Lmod spider and return the JSON catalog.
    """

    spider = get_spider_path()

    cmd = [
        spider,
        "-o",
        "jsonSoftwarePage",
    ]

    if module_path:
        cmd.append(module_path)
    else:
        modulepath = os.environ.get("MODULEPATH")
        if modulepath:
            cmd.append(modulepath)

    print("Running:", " ".join(cmd))

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    catalog = json.loads(result.stdout)

    for pkg in catalog:
        if not pkg["package"].startswith("LCG_"):
            continue

        available = platforms(pkg["package"])

        pkg["platforms"] = available
        pkg["selectedPlatform"] = choose_platform(available)

    return catalog
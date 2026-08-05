import json
import os
import subprocess

from .config import configured_paths
from .platform_detector import (
    available_platforms,
    select_default_platform,
)


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


def get_catalog(platform: str | None = None):
    """
    Build a software catalog by scanning all configured
    module trees with Lmod Spider.
    """

    if platform is None:
        platform = select_default_platform()

    if platform is None:
        raise RuntimeError("No compatible platform found.")

    if platform not in available_platforms():
        raise RuntimeError(
            f"Unknown platform: {platform}"
        )

    spider = get_spider_path()

    repositories = []

    for name, module_path in configured_paths(platform).items():

        print(f"Scanning {name}")
        print(module_path)

        cmd = [
            spider,
            "-o",
            "jsonSoftwarePage",
            module_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise RuntimeError(
                result.stderr.strip()
            )

        catalog = json.loads(result.stdout)

        repositories.append(
            {
                "name": name,
                "packages": sorted(
                    catalog,
                    key=lambda pkg: pkg["package"].lower(),
                ),
            }
        )

    return {
        "platform": platform,
        "repositories": repositories,
    }
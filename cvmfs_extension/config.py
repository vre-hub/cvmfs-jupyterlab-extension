import os

LMOD_INIT = "/cvmfs/software.eessi.io/versions/2023.06/init/lmod/bash"

MODULE_PATHS = {
    "LCG Releases":
        "/afs/cern.ch/user/o/ojain/cvmfs_extension_backup/lcg_generator/generated_modules/{platform}",
}


def configured_paths(platform: str):

    paths = {
        "LCG Releases":
            MODULE_PATHS["LCG Releases"].format(
                platform=platform
            )
    }

    eessi_modulepath = os.environ.get("EESSI_MODULEPATH")

    if eessi_modulepath:
        paths["EESSI"] = eessi_modulepath

    return paths
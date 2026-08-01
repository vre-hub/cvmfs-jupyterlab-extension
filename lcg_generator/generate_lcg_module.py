#!/usr/bin/env python3

from pathlib import Path
import sys

from envdiff import parse_env, compare
from renderer import LuaRenderer


def main():

    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} before.env after.env output.lua")
        sys.exit(1)

    before_file = Path(sys.argv[1])
    after_file = Path(sys.argv[2])
    output_file = Path(sys.argv[3])

    before = parse_env(before_file)
    after = parse_env(after_file)

    changes = compare(before, after)

    # Extract release number from output path
    # e.g. generated_modules/LCG_108/x86_64-el9-gcc14-opt.lua -> 108
    release = output_file.stem

    lua = LuaRenderer(release).render(changes)

    output_file.write_text(lua)

    print(f"Generated {output_file}")


if __name__ == "__main__":
    main()
#!/bin/bash
set -e

OUTDIR=generated_modules
mkdir -p "$OUTDIR"

# LCG 106 (only gcc13)
mkdir -p "${OUTDIR}/x86_64-el9-gcc13-opt/LCG"

echo "Generating LCG_106 x86_64-el9-gcc13-opt..."

env | sort > before.env

(
    source "/cvmfs/sft.cern.ch/lcg/views/LCG_106/x86_64-el9-gcc13-opt/setup.sh"
    env | sort > after.env
)

python3 generate_lcg_module.py \
    before.env \
    after.env \
    "${OUTDIR}/x86_64-el9-gcc13-opt/LCG/106.lua"


# LCG 107-110
RELEASES=(107 108 109 110)

PLATFORMS=(
    x86_64-el9-gcc13-opt
    x86_64-el9-gcc14-opt
)

for REL in "${RELEASES[@]}"; do

    for PLATFORM in "${PLATFORMS[@]}"; do

        mkdir -p "${OUTDIR}/${PLATFORM}/LCG"

        echo "Generating LCG_${REL} ${PLATFORM}..."

        env | sort > before.env

        (
            source "/cvmfs/sft.cern.ch/lcg/views/LCG_${REL}/${PLATFORM}/setup.sh"
            env | sort > after.env
        )

        python3 generate_lcg_module.py \
            before.env \
            after.env \
            "${OUTDIR}/${PLATFORM}/LCG/${REL}.lua"

    done

done

rm -f before.env after.env

echo "Done."

import json

import pytest

from cvmfs_extension import kernel_launcher


def test_create_kernel(monkeypatch, tmp_path):
    monkeypatch.setattr(kernel_launcher, "KERNELS_DIR", tmp_path)
    monkeypatch.setattr(
        kernel_launcher,
        "configured_paths",
        lambda platform: {"LCG Releases": "/modules/lcg"},
    )

    kernel_name = kernel_launcher.create_kernel(
        modules=["LCG/107"],
        platform="x86_64-el9-gcc13-opt",
        display_name="LCG 107",
    )

    kernel_dir = tmp_path / kernel_name

    assert kernel_name == "cvmfs-x86_64-el9-gcc13-opt-lcg-107"
    assert (kernel_dir / "launcher.sh").exists()
    assert (kernel_dir / "kernel.json").exists()
    assert (kernel_dir / "metadata.json").exists()


def test_launcher_contains_module_setup(monkeypatch, tmp_path):
    monkeypatch.setattr(kernel_launcher, "KERNELS_DIR", tmp_path)
    monkeypatch.setattr(
        kernel_launcher,
        "configured_paths",
        lambda platform: {"LCG Releases": "/modules/lcg"},
    )

    kernel_name = kernel_launcher.create_kernel(
        ["LCG/107"],
        "x86_64-el9-gcc13-opt",
        "LCG 107",
    )

    launcher = (
        tmp_path / kernel_name / "launcher.sh"
    ).read_text()

    assert f"source {kernel_launcher.LMOD_INIT}" in launcher
    assert "module purge" in launcher
    assert "module use /modules/lcg" in launcher
    assert "module load LCG/107" in launcher
    assert 'exec python -m ipykernel_launcher "$@"' in launcher


def test_kernel_json(monkeypatch, tmp_path):
    monkeypatch.setattr(kernel_launcher, "KERNELS_DIR", tmp_path)
    monkeypatch.setattr(
        kernel_launcher,
        "configured_paths",
        lambda platform: {"LCG Releases": "/modules/lcg"},
    )

    kernel_name = kernel_launcher.create_kernel(
        ["LCG/107"],
        "x86_64-el9-gcc13-opt",
        "LCG 107",
    )

    kernel_json = json.loads(
        (tmp_path / kernel_name / "kernel.json").read_text()
    )

    assert kernel_json["display_name"] == "LCG 107"
    assert kernel_json["language"] == "python"
    assert kernel_json["argv"][0].endswith("launcher.sh")
    assert kernel_json["argv"][1:] == ["-f", "{connection_file}"]


def test_create_kernel_requires_modules():
    with pytest.raises(ValueError, match="At least one module"):
        kernel_launcher.create_kernel(
            [],
            "x86_64-el9-gcc13-opt",
            "Test",
        )


def test_create_kernel_requires_platform():
    with pytest.raises(ValueError, match="Platform is required"):
        kernel_launcher.create_kernel(
            ["LCG/107"],
            "",
            "Test",
        )
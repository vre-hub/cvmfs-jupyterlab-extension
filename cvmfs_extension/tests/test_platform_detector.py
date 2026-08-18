from cvmfs_extension import platform_detector


def test_detect_host(monkeypatch):
    monkeypatch.setattr(
        platform_detector,
        "detect_architecture",
        lambda: "x86_64",
    )
    monkeypatch.setattr(
        platform_detector,
        "detect_os",
        lambda: "el9",
    )

    assert platform_detector.detect_host() == ("x86_64", "el9")


def test_available_platforms(monkeypatch, tmp_path):
    (tmp_path / "x86_64-el9-gcc13-opt").mkdir()
    (tmp_path / "x86_64-el9-gcc12-opt").mkdir()

    monkeypatch.setattr(
        platform_detector,
        "MODULE_ROOT",
        tmp_path,
    )

    assert platform_detector.available_platforms() == [
        "x86_64-el9-gcc12-opt",
        "x86_64-el9-gcc13-opt",
    ]


def test_compatible_platforms(monkeypatch):
    monkeypatch.setattr(
        platform_detector,
        "detect_host",
        lambda: ("x86_64", "el9"),
    )
    monkeypatch.setattr(
        platform_detector,
        "available_platforms",
        lambda: [
            "x86_64-el9-gcc13-opt",
            "x86_64-el8-gcc13-opt",
        ],
    )

    assert platform_detector.compatible_platforms() == [
        "x86_64-el9-gcc13-opt",
    ]


def test_select_default_platform(monkeypatch):
    monkeypatch.setattr(
        platform_detector,
        "compatible_platforms",
        lambda: [
            "x86_64-el9-gcc12-opt",
            "x86_64-el9-gcc13-dbg",
            "x86_64-el9-gcc13-opt",
        ],
    )

    assert (
        platform_detector.select_default_platform()
        == "x86_64-el9-gcc13-opt"
    )


def test_select_default_platform_no_compatible(monkeypatch):
    monkeypatch.setattr(
        platform_detector,
        "compatible_platforms",
        lambda: [],
    )

    assert platform_detector.select_default_platform() is None
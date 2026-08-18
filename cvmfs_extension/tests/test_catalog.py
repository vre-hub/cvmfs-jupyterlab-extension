import json

import pytest

from cvmfs_extension import catalog


def test_get_catalog(monkeypatch):
    spider_output = [
        {"package": "Python", "version": "3.11"},
        {"package": "ROOT", "version": "6.32"},
    ]

    monkeypatch.setattr(
        catalog,
        "select_default_platform",
        lambda: "x86_64-el9-gcc13-opt",
    )
    monkeypatch.setattr(
        catalog,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        catalog,
        "get_spider_path",
        lambda: "/usr/bin/spider",
    )
    monkeypatch.setattr(
        catalog,
        "configured_paths",
        lambda platform: {
            "LCG Releases": "/modules/lcg",
        },
    )

    class Result:
        returncode = 0
        stdout = json.dumps(spider_output)
        stderr = ""

    monkeypatch.setattr(
        catalog.subprocess,
        "run",
        lambda *args, **kwargs: Result(),
    )

    result = catalog.get_catalog()

    assert result == {
        "platform": "x86_64-el9-gcc13-opt",
        "repositories": [
            {
                "name": "LCG Releases",
                "packages": spider_output,
            }
        ],
    }


def test_get_catalog_multiple_repositories(monkeypatch):
    monkeypatch.setattr(
        catalog,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        catalog,
        "get_spider_path",
        lambda: "/usr/bin/spider",
    )
    monkeypatch.setattr(
        catalog,
        "configured_paths",
        lambda platform: {
            "LCG Releases": "/modules/lcg",
            "EESSI": "/modules/eessi",
        },
    )

    outputs = iter(
        [
            [{"package": "ROOT", "version": "6.32"}],
            [{"package": "Python", "version": "3.11"}],
        ]
    )

    class Result:
        returncode = 0
        stderr = ""

        @property
        def stdout(self):
            return json.dumps(next(outputs))

    monkeypatch.setattr(
        catalog.subprocess,
        "run",
        lambda *args, **kwargs: Result(),
    )

    result = catalog.get_catalog(
        "x86_64-el9-gcc13-opt"
    )

    assert [
        repo["name"]
        for repo in result["repositories"]
    ] == [
        "LCG Releases",
        "EESSI",
    ]


def test_get_spider_path_missing_lmod(monkeypatch):
    monkeypatch.delenv(
        "LMOD_CMD",
        raising=False,
    )

    with pytest.raises(
        RuntimeError,
        match="LMOD_CMD is not set",
    ):
        catalog.get_spider_path()


def test_get_catalog_spider_failure(monkeypatch):
    monkeypatch.setattr(
        catalog,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        catalog,
        "get_spider_path",
        lambda: "/usr/bin/spider",
    )
    monkeypatch.setattr(
        catalog,
        "configured_paths",
        lambda platform: {
            "LCG Releases": "/modules/lcg"
        },
    )

    class Result:
        returncode = 1
        stdout = ""
        stderr = "spider failed"

    monkeypatch.setattr(
        catalog.subprocess,
        "run",
        lambda *args, **kwargs: Result(),
    )

    with pytest.raises(
        RuntimeError,
        match="spider failed",
    ):
        catalog.get_catalog(
            "x86_64-el9-gcc13-opt"
        )


def test_get_catalog_invalid_json(monkeypatch):
    monkeypatch.setattr(
        catalog,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        catalog,
        "get_spider_path",
        lambda: "/usr/bin/spider",
    )
    monkeypatch.setattr(
        catalog,
        "configured_paths",
        lambda platform: {
            "LCG Releases": "/modules/lcg"
        },
    )

    class Result:
        returncode = 0
        stdout = "not valid json"
        stderr = ""

    monkeypatch.setattr(
        catalog.subprocess,
        "run",
        lambda *args, **kwargs: Result(),
    )

    with pytest.raises(json.JSONDecodeError):
        catalog.get_catalog(
            "x86_64-el9-gcc13-opt"
        )


def test_get_catalog_unknown_platform(monkeypatch):
    monkeypatch.setattr(
        catalog,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )

    with pytest.raises(
        RuntimeError,
        match="Unknown platform: invalid-platform",
    ):
        catalog.get_catalog(
            "invalid-platform"
        )


def test_get_catalog_no_compatible_platform(
    monkeypatch,
):
    monkeypatch.setattr(
        catalog,
        "select_default_platform",
        lambda: None,
    )

    with pytest.raises(
        RuntimeError,
        match="No compatible platform found.",
    ):
        catalog.get_catalog()
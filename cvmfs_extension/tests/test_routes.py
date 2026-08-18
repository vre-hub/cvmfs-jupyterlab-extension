import json


async def test_platform(jp_fetch, monkeypatch):
    from cvmfs_extension import routes

    monkeypatch.setattr(
        routes,
        "detect_host",
        lambda: ("x86_64", "el9"),
    )
    monkeypatch.setattr(
        routes,
        "available_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        routes,
        "compatible_platforms",
        lambda: ["x86_64-el9-gcc13-opt"],
    )
    monkeypatch.setattr(
        routes,
        "select_default_platform",
        lambda: "x86_64-el9-gcc13-opt",
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "platform",
    )

    assert response.code == 200

    payload = json.loads(response.body)

    assert payload["architecture"] == "x86_64"
    assert payload["os"] == "el9"
    assert payload["selected"] == (
        "x86_64-el9-gcc13-opt"
    )


async def test_platform_failure(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    def fail():
        raise RuntimeError(
            "Could not determine a compatible platform"
        )

    monkeypatch.setattr(
        routes,
        "detect_host",
        fail,
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "platform",
        raise_error=False,
    )

    assert response.code == 500

    payload = json.loads(response.body)

    assert payload["error"] == (
        "Could not determine a compatible platform"
    )


async def test_catalog(jp_fetch, monkeypatch):
    from cvmfs_extension import routes

    monkeypatch.setattr(
        routes,
        "get_catalog",
        lambda platform: {
            "platform": platform,
            "repositories": [],
        },
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "catalog",
        params={
            "platform": "x86_64-el9-gcc13-opt"
        },
    )

    assert response.code == 200

    payload = json.loads(response.body)

    assert payload == {
        "platform": "x86_64-el9-gcc13-opt",
        "repositories": [],
    }


async def test_catalog_failure(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    def fail(platform):
        raise RuntimeError(
            "No module tree found for platform"
        )

    monkeypatch.setattr(
        routes,
        "get_catalog",
        fail,
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "catalog",
        params={
            "platform": "x86_64-el9-gcc13-opt"
        },
        raise_error=False,
    )

    assert response.code == 500

    payload = json.loads(response.body)

    assert payload["error"] == (
        "No module tree found for platform"
    )


async def test_activate(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    monkeypatch.setattr(
        routes,
        "create_kernel",
        lambda modules, platform, display_name:
            "cvmfs-x86_64-el9-gcc13-opt-lcg-107",
    )
    monkeypatch.setattr(
        routes,
        "select_default_platform",
        lambda: "x86_64-el9-gcc13-opt",
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "activate",
        method="POST",
        body=json.dumps(
            {
                "modules": ["LCG/107"],
                "platform": "x86_64-el9-gcc13-opt",
                "display_name": "LCG 107",
            }
        ),
        headers={
            "Content-Type": "application/json"
        },
    )

    assert response.code == 200

    payload = json.loads(response.body)

    assert payload["status"] == "ok"
    assert payload["kernel_name"] == (
        "cvmfs-x86_64-el9-gcc13-opt-lcg-107"
    )


async def test_activate_requires_modules(jp_fetch):
    response = await jp_fetch(
        "cvmfs-extension",
        "activate",
        method="POST",
        body=json.dumps(
            {"modules": []}
        ),
        headers={
            "Content-Type": "application/json"
        },
        raise_error=False,
    )

    assert response.code == 400

    payload = json.loads(response.body)

    assert payload["code"] == "INVALID_REQUEST"


async def test_activate_failure(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    def fail(
        modules,
        platform,
        display_name,
    ):
        raise RuntimeError(
            "Module LCG/107 could not be loaded"
        )

    monkeypatch.setattr(
        routes,
        "create_kernel",
        fail,
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "activate",
        method="POST",
        body=json.dumps(
            {
                "modules": ["LCG/107"],
                "platform": "x86_64-el9-gcc13-opt",
                "display_name": "LCG 107",
            }
        ),
        headers={
            "Content-Type": "application/json"
        },
        raise_error=False,
    )

    assert response.code == 500

    payload = json.loads(response.body)

    assert payload["code"] == (
        "ACTIVATION_FAILED"
    )
    assert payload["message"] == (
        "Module LCG/107 could not be loaded"
    )


async def test_kernels(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    monkeypatch.setattr(
        routes,
        "validate_kernels",
        lambda: [
            {
                "kernel_name": "cvmfs-test",
                "available": True,
            }
        ],
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "kernels",
    )

    assert response.code == 200

    payload = json.loads(response.body)

    assert payload["kernels"][0]["kernel_name"] == (
        "cvmfs-test"
    )


async def test_kernels_failure(
    jp_fetch,
    monkeypatch,
):
    from cvmfs_extension import routes

    def fail():
        raise RuntimeError(
            "Failed to inspect kernels"
        )

    monkeypatch.setattr(
        routes,
        "validate_kernels",
        fail,
    )

    response = await jp_fetch(
        "cvmfs-extension",
        "kernels",
        raise_error=False,
    )

    assert response.code == 500

    payload = json.loads(response.body)

    assert payload["error"] == (
        "Failed to inspect kernels"
    )


async def test_terminal_requires_modules(
    jp_fetch,
):
    response = await jp_fetch(
        "cvmfs-extension",
        "terminal",
        method="POST",
        body=json.dumps(
            {
                "modules": [],
                "platform": "x86_64-el9-gcc13-opt",
            }
        ),
        headers={
            "Content-Type": "application/json"
        },
        raise_error=False,
    )

    assert response.code == 400

    payload = json.loads(response.body)

    assert payload["code"] == "INVALID_REQUEST"
    assert payload["message"] == (
        "At least one module is required"
    )


async def test_terminal_requires_platform(
    jp_fetch,
):
    response = await jp_fetch(
        "cvmfs-extension",
        "terminal",
        method="POST",
        body=json.dumps(
            {
                "modules": ["LCG/107"],
            }
        ),
        headers={
            "Content-Type": "application/json"
        },
        raise_error=False,
    )

    assert response.code == 400

    payload = json.loads(response.body)

    assert payload["code"] == "INVALID_REQUEST"
    assert payload["message"] == (
        "Platform is required"
    )
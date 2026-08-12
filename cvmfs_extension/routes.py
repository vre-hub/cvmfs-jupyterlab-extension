import json

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from .kernel_launcher import validate_kernels, remove_kernel
from .catalog import get_catalog
from .kernel_launcher import create_kernel
from .platform_detector import (
    detect_host,
    available_platforms,
    compatible_platforms,
    select_default_platform,
)

class KernelRouteHandler(APIHandler):
    @tornado.web.authenticated
    async def delete(self, kernel_name):
        try:
            remove_kernel(kernel_name)

            self.finish(
                json.dumps(
                    {
                        "status": "ok",
                        "kernel_name": kernel_name,
                    }
                )
            )

        except FileNotFoundError as exc:
            self.set_status(404)
            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code": "KERNEL_NOT_FOUND",
                        "message": str(exc),
                    }
                )
            )

        except ValueError as exc:
            self.set_status(400)
            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code": "INVALID_KERNEL",
                        "message": str(exc),
                    }
                )
            )

        except Exception as exc:
            self.set_status(500)
            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code": "REMOVE_FAILED",
                        "message": str(exc),
                    }
                )
            )

class CatalogRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        try:

            platform = self.get_argument("platform", None)

            catalog = get_catalog(platform)

            self.finish(json.dumps(catalog))

        except Exception as exc:

            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "error": str(exc)
                    }
                )
            )


class PlatformRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        try:

            arch, os_name = detect_host()

            self.finish(
                json.dumps(
                    {
                        "architecture": arch,
                        "os": os_name,
                        "available": available_platforms(),
                        "compatible": compatible_platforms(),
                        "selected": select_default_platform(),
                    }
                )
            )

        except Exception as exc:

            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "error": str(exc)
                    }
                )
            )


class ActivateRouteHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()

            modules = data.get("modules")
            platform = data.get("platform")
            display_name = data.get("display_name")

            if not modules:
                self.set_status(400)
                self.finish(
                    json.dumps(
                        {
                            "status": "error",
                            "code": "INVALID_REQUEST",
                            "message": "At least one module is required",
                        }
                    )
                )
                return

            if not platform:
                platform = select_default_platform()

            if not display_name:
                display_name = "Python (" + ", ".join(modules) + ")"

            kernel_name = create_kernel(
                modules=modules,
                platform=platform,
                display_name=display_name,
            )

            self.finish(
                json.dumps(
                    {
                        "status": "ok",
                        "kernel_name": kernel_name,
                        "display_name": display_name,
                    }
                )
            )

        except Exception as exc:
            print("ACTIVATION FAILED:", repr(exc), flush=True)

            self.set_status(500)
            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code": "ACTIVATION_FAILED",
                        "message": str(exc),
                    }
                )
            )

def setup_route_handlers(web_app):

    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    catalog_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "catalog",
    )

    platform_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "platform",
    )

    activate_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "activate",
    )

    kernels_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "kernels",
    )

    kernel_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "kernels",
        "([^/]+)",
    )

    handlers = [

        (
            catalog_route_pattern,
            CatalogRouteHandler,
        ),

        (
            platform_route_pattern,
            PlatformRouteHandler,
        ),

        (
            activate_route_pattern,
            ActivateRouteHandler,
        ),

        (
            kernels_route_pattern,
            KernelsRouteHandler,
        ),

        (
            kernel_route_pattern,
            KernelRouteHandler,
        ),
    ]

    web_app.add_handlers(host_pattern, handlers)

class KernelsRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        try:
            kernels = validate_kernels()

            self.finish(
                json.dumps(
                    {
                        "kernels": kernels
                    }
                )
            )

        except Exception as exc:
            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "error": str(exc)
                    }
                )
            )
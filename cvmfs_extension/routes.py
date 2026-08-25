import json

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from .catalog import get_catalog
from .collections import get_collections
from .kernel_launcher import (
    create_kernel,
    remove_kernel,
    validate_kernels,
)
from .platform_detector import (
    detect_host,
    available_platforms,
    compatible_platforms,
    select_default_platform,
)
from .terminal_launcher import (
    build_terminal_command,
    terminal_name,
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

            platform = self.get_argument(
                "platform",
                None,
            )

            catalog = get_catalog(platform)

            self.finish(
                json.dumps(catalog)
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


class CollectionsRouteHandler(APIHandler):

    @tornado.web.authenticated
    def get(self):

        try:

            collections = get_collections()

            self.finish(
                json.dumps(
                    {
                        "collections": collections
                    }
                )
            )

        except Exception as exc:

            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code": "COLLECTIONS_FAILED",
                        "message": str(exc),
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
                        "available":
                            available_platforms(),
                        "compatible":
                            compatible_platforms(),
                        "selected":
                            select_default_platform(),
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
            display_name = data.get(
                "display_name"
            )

            if not modules:

                self.set_status(400)

                self.finish(
                    json.dumps(
                        {
                            "status": "error",
                            "code": "INVALID_REQUEST",
                            "message":
                                "At least one module is required",
                        }
                    )
                )

                return

            if not platform:

                platform = (
                    select_default_platform()
                )

            if not display_name:

                display_name = (
                    "Python ("
                    + ", ".join(modules)
                    + ")"
                )

            kernel_name = create_kernel(
                modules=modules,
                platform=platform,
                display_name=display_name,
            )

            self.finish(
                json.dumps(
                    {
                        "status": "ok",
                        "kernel_name":
                            kernel_name,
                        "display_name":
                            display_name,
                    }
                )
            )

        except Exception as exc:

            print(
                "ACTIVATION FAILED:",
                repr(exc),
                flush=True,
            )

            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code":
                            "ACTIVATION_FAILED",
                        "message": str(exc),
                    }
                )
            )


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


class TerminalRouteHandler(APIHandler):

    @tornado.web.authenticated
    def post(self):

        try:

            data = self.get_json_body()

            modules = data.get("modules")
            platform = data.get("platform")

            if not modules:

                self.set_status(400)

                self.finish(
                    json.dumps(
                        {
                            "status": "error",
                            "code":
                                "INVALID_REQUEST",
                            "message":
                                "At least one module is required",
                        }
                    )
                )

                return

            if not platform:

                self.set_status(400)

                self.finish(
                    json.dumps(
                        {
                            "status": "error",
                            "code":
                                "INVALID_REQUEST",
                            "message":
                                "Platform is required",
                        }
                    )
                )

                return

            command = build_terminal_command(
                modules=modules,
                platform=platform,
            )

            name = terminal_name(
                modules=modules,
                platform=platform,
            )

            terminal_manager = (
                self.settings[
                    "terminal_manager"
                ]
            )

            terminal = terminal_manager.create(
                name=name,
                shell_command=command,
            )

            self.finish(
                json.dumps(
                    {
                        "status": "ok",
                        "name": terminal["name"],
                        "modules": modules,
                        "platform": platform,
                    }
                )
            )

        except Exception as exc:

            self.set_status(500)

            self.finish(
                json.dumps(
                    {
                        "status": "error",
                        "code":
                            "TERMINAL_CREATION_FAILED",
                        "message": str(exc),
                    }
                )
            )


def setup_route_handlers(web_app):

    host_pattern = ".*$"

    base_url = web_app.settings[
        "base_url"
    ]

    catalog_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "catalog",
    )

    collections_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "collections",
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

    terminal_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "terminal",
    )

    handlers = [

        (
            catalog_route_pattern,
            CatalogRouteHandler,
        ),

        (
            collections_route_pattern,
            CollectionsRouteHandler,
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

        (
            terminal_route_pattern,
            TerminalRouteHandler,
        ),
    ]

    web_app.add_handlers(
        host_pattern,
        handlers,
    )
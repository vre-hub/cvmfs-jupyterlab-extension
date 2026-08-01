import json

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from .catalog import get_catalog


class CatalogRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        try:
            catalog = get_catalog()
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


def setup_route_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    catalog_route_pattern = url_path_join(
        base_url,
        "cvmfs-extension",
        "catalog",
    )

    handlers = [
        (
            catalog_route_pattern,
            CatalogRouteHandler,
        )
    ]

    web_app.add_handlers(host_pattern, handlers)
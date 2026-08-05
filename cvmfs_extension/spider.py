"""
Minimal standalone server to test the spider -> JSON -> frontend pipeline.

Run:

    source /cvmfs/software.eessi.io/versions/2023.06/init/lmod/bash
    python3 spider.py
"""

import http.server
import json
import os
import subprocess
from urllib.parse import urlparse, parse_qs
from platform_detector import (
    MODULE_ROOT,
    detect_host,
    available_platforms,
    compatible_platforms,
    select_default_platform,
)

def get_spider_path():
    """Locate the spider executable from LMOD_CMD."""

    lmod_cmd = os.environ.get("LMOD_CMD")

    if not lmod_cmd:
        raise RuntimeError(
            "LMOD_CMD is not set. Did you source the Lmod init script?"
        )

    spider_path = os.path.join(
        os.path.dirname(lmod_cmd),
        "spider",
    )

    if not os.path.exists(spider_path):
        raise RuntimeError(
            f"Spider executable not found:\n{spider_path}"
        )

    return spider_path


class CatalogHandler(http.server.BaseHTTPRequestHandler):

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")

    def do_GET(self):
        print("Received request:", self.path)

        parsed = urlparse(self.path)

        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/catalog":
            self.handle_catalog(query)

        elif path == "/platform":
            self.handle_platform()

        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

    def handle_catalog(self, query):
        try:

            platform = query.get("platform", [None])[0]

            if platform is None:
                platform = select_default_platform()

            if platform is None:
                raise RuntimeError("No compatible platform found.")

            if platform not in available_platforms():
                raise RuntimeError(
                    f"Unknown platform: {platform}"
                )
            module_tree = MODULE_ROOT / platform
            if not module_tree.exists():
                raise RuntimeError(
                    f"Module tree does not exist:\n{module_tree}"
                )

            spider = get_spider_path()

            spider_cmd = [
                spider,
                "-o",
                "jsonSoftwarePage",
                str(module_tree),
            ]

            print("Selected platform:", platform)
            print("Module tree:", module_tree)
            print("Running:", " ".join(spider_cmd))

            result = subprocess.run(
                spider_cmd,
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode != 0:
                raise RuntimeError(result.stderr.strip())

            catalog = json.loads(result.stdout)

            response = {
                "platform": platform,
                "packages": catalog
            }

            body = json.dumps(response).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()

            self.wfile.write(body)

        except Exception as exc:

            error_body = json.dumps(
                {
                    "error": str(exc)
                }
            ).encode("utf-8")

            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()

            self.wfile.write(error_body)

    def handle_platform(self):
        try:

            arch, os_name = detect_host()

            body = json.dumps(
                {
                    "architecture": arch,
                    "os": os_name,
                    "available": available_platforms(),
                    "compatible": compatible_platforms(),
                    "selected": select_default_platform(),
                }
            ).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()

            self.wfile.write(body)

        except Exception as exc:

            body = json.dumps(
                {
                    "error": str(exc)
                }
            ).encode("utf-8")

            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()

            self.wfile.write(body)

if __name__ == "__main__":

    platform = select_default_platform()

    print(f"Detected platform: {platform}")

    if platform:
        print(f"Serving modules from: {MODULE_ROOT / platform}")

    server = http.server.HTTPServer(("localhost", 8001), CatalogHandler)

    print("Backend running at http://localhost:8001/catalog")

    server.serve_forever()
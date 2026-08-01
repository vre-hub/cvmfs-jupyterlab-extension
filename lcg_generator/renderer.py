from envdiff import SetEnv, UnsetEnv, PrependPath, AppendPath


def lua_quote(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
         .replace('"', '\\"')
    )


class LuaRenderer:

    def __init__(self, release):
        self.release = release

    def render(self, changes):

        lines = [
            "-- Auto-generated from LCG setup.sh",
            "",
            "help([[",
            f"LCG {self.release} environment",
            "Automatically generated from setup.sh",
            "]])",
            "",
            'whatis("Name: LCG")',
            f'whatis("Version: {self.release}")',
            'whatis("Category: Software Stack")',
            'family("LCG")',
            "",
        ]

        for change in changes:

            if isinstance(change, SetEnv):
                lines.append(
                    f'setenv("{change.variable}", "{lua_quote(change.value)}")'
                )

            elif isinstance(change, UnsetEnv):
                lines.append(
                    f'unsetenv("{change.variable}")'
                )

            elif isinstance(change, PrependPath):
                lines.append(
                    f'prepend_path("{change.variable}", "{lua_quote(change.value)}")'
                )

            elif isinstance(change, AppendPath):
                lines.append(
                    f'append_path("{change.variable}", "{lua_quote(change.value)}")'
                )

        return "\n".join(lines)
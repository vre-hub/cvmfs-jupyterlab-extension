from dataclasses import dataclass
from pathlib import Path

# ---------- Change objects ----------

@dataclass
class Change:
    variable: str

@dataclass
class SetEnv(Change):
    value: str

@dataclass
class UnsetEnv(Change):
    pass

@dataclass
class PrependPath(Change):
    value: str

@dataclass
class AppendPath(Change):
    value: str


# ---------- Configuration ----------

PATH_VARIABLES = {
    "PATH",
    "LD_LIBRARY_PATH",
    "PYTHONPATH",
    "MANPATH",
    "PKG_CONFIG_PATH",
    "CMAKE_PREFIX_PATH",
    "ROOT_INCLUDE_PATH",
    "C_INCLUDE_PATH",
    "CPLUS_INCLUDE_PATH",
    "JUPYTER_PATH",
    "ACLOCAL_PATH",
    "COMPILER_PATH",
    "FONTCONFIG_PATH",
    "GIT_EXEC_PATH",
    "GOPATH",
    "HADOOP_CLASSPATH",
    "JULIA_DEPOT_PATH",
    "JULIA_LOAD_PATH",
    "LHAPDF_DATA_PATH",
    "OL_PROCLIB_PATH",
    "QT_PLUGIN_PATH",
    "SPARK_DIST_CLASSPATH",
}

IGNORE = {
    "PWD",
    "OLDPWD",
    "SHLVL",
    "LINES",
    "COLUMNS",
    "_",
    "TERM",
    "SSH_CLIENT",
    "SSH_CONNECTION",
    "SSH_TTY",
}


# ---------- Parsing ----------

def parse_env(path: Path) -> dict[str, str]:
    env = {}

    with open(path) as f:
        for line in f:
            line = line.rstrip()

            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            env[key] = value

    return env


# ---------- Helpers ----------

def _split(value: str):
    return [x for x in value.split(":") if x]


def detect_prepend(before: str, after: str):
    b = _split(before)
    a = _split(after)

    if len(a) >= len(b) and a[-len(b):] == b:
        return a[:-len(b)] if b else a

    return None


def detect_append(before: str, after: str):
    b = _split(before)
    a = _split(after)

    if len(a) >= len(b) and a[:len(b)] == b:
        return a[len(b):]

    return None


# ---------- Main diff ----------

def compare(before: dict[str, str], after: dict[str, str]):

    changes = []

    variables = sorted(set(before) | set(after))

    for var in variables:

        if var in IGNORE:
            continue

        old = before.get(var)
        new = after.get(var)

        # Removed
        if new is None:
            changes.append(UnsetEnv(var))
            continue

        # Added
        if old is None:
            if var in PATH_VARIABLES:
                for value in reversed(_split(new)):
                    changes.append(PrependPath(var, value))
            else:
                changes.append(SetEnv(var, new))
            continue

        # Unchanged
        if old == new:
            continue

        # Path variables
        if var in PATH_VARIABLES:

            prepended = detect_prepend(old, new)
            if prepended is not None:
                for value in reversed(prepended):
                    changes.append(PrependPath(var, value))
                continue

            appended = detect_append(old, new)
            if appended is not None:
                for value in appended:
                    changes.append(AppendPath(var, value))
                continue

        changes.append(SetEnv(var, new))

    return changes


# ---------- Example ----------

if __name__ == "__main__":

    before = parse_env(Path("before.env"))
    after = parse_env(Path("after.env"))

    changes = compare(before, after)

    for c in changes:
        print(c)
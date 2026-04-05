#!/usr/bin/env python3
"""Stop hook: warn about console.log left in modified files."""

import json
import os
import subprocess


def main() -> None:
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # No git history yet or not a repo — nothing to check.
        return

    extensions = (".ts", ".tsx", ".js", ".jsx")
    warnings: list[str] = []

    for line in result.stdout.strip().splitlines():
        filepath = line.strip()
        if not filepath.endswith(extensions) or not os.path.exists(filepath):
            continue
        with open(filepath, encoding="utf-8", errors="ignore") as f:
            if "console.log" in f.read():
                warnings.append(f"console.log in {filepath}")

    if warnings:
        msg = {"systemMessage": "WARNING: " + "; ".join(warnings)}
        print(json.dumps(msg))


if __name__ == "__main__":
    main()

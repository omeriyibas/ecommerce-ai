from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT / 'src'))


def ask(prompt: str, default: str | None = None) -> str:
    suffix = f' [{default}]' if default is not None else ''
    raw = input(f'{prompt}{suffix}: ').strip()
    if not raw and default is not None:
        return default
    return raw


def ask_int(prompt: str, *, default: int, min_value: int = 1) -> int:
    while True:
        raw = ask(prompt, str(default))
        try:
            value = int(raw)
        except ValueError:
            print('Geçerli bir sayı girin.')
            continue
        if value < min_value:
            print(f'En az {min_value} olmalı.')
            continue
        return value

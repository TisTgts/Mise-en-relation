"""
Charge la configuration pays depuis le dossier racine `pays/`.

Priorité du code pays :
1. Variable d'environnement COUNTRY_CODE
2. Fichier pays/active.json
3. Défaut : tg
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

DEFAULT_COUNTRY_CODE = "tg"


def pays_dir() -> Path:
    """Racine du dépôt / pays (backend/transport_platform → repo)."""
    return Path(__file__).resolve().parent.parent.parent / "pays"


def resolve_country_code() -> str:
    env_code = (os.environ.get("COUNTRY_CODE") or "").strip().lower()
    if env_code:
        return env_code

    active_path = pays_dir() / "active.json"
    if active_path.is_file():
        try:
            data = json.loads(active_path.read_text(encoding="utf-8"))
            code = (data.get("code") or "").strip().lower()
            if code:
                return code
        except (OSError, json.JSONDecodeError, TypeError):
            pass

    return DEFAULT_COUNTRY_CODE


@lru_cache(maxsize=8)
def load_country(code: str | None = None) -> dict[str, Any]:
    country_code = (code or resolve_country_code()).strip().lower()
    path = pays_dir() / f"{country_code}.json"
    if not path.is_file():
        fallback = pays_dir() / f"{DEFAULT_COUNTRY_CODE}.json"
        if not fallback.is_file():
            raise FileNotFoundError(
                f"Config pays introuvable : {path} (ni fallback {fallback})"
            )
        path = fallback
        country_code = DEFAULT_COUNTRY_CODE

    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("code", country_code)
    return data


def get_country() -> dict[str, Any]:
    return load_country()


def get_primary_cities() -> list[dict[str, Any]]:
    cities = get_country().get("cities") or []
    primary = [c for c in cities if c.get("primary")]
    return primary or list(cities)


def get_city_names() -> list[str]:
    return [c["name"] for c in (get_country().get("cities") or []) if c.get("name")]


def get_timezone() -> str:
    return get_country().get("timezone") or "UTC"


def clear_country_cache() -> None:
    load_country.cache_clear()

"""
Collecte en mémoire des métriques de trafic API.

Objectif : donner au super administrateur une vue « santé » de la plateforme
(volume de requêtes, taux d'erreur, latence par endpoint, dernières erreurs)
sans dépendance externe — avec ventilation web / mobile via en-tête X-Client-App.

Limites : les compteurs vivent dans le process (remis à zéro au redémarrage) et
sont propres à chaque worker en production multi-process. C'est volontaire :
léger et suffisant pour un aperçu opérationnel.
"""
from __future__ import annotations

import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any

# Fenêtre de latences conservée par endpoint (pour la moyenne / p95).
_MAX_DURATIONS_PER_ENDPOINT = 200
# Nombre d'erreurs récentes conservées globalement.
_MAX_RECENT_ERRORS = 50

CLIENT_MOBILE = "mobile"
CLIENT_WEB = "web"
CLIENT_OTHER = "other"
_CLIENTS = (CLIENT_MOBILE, CLIENT_WEB, CLIENT_OTHER)


def _empty_endpoint(method: str, route: str, status_code: int, duration_ms: float, now: str) -> dict[str, Any]:
    return {
        "method": method,
        "route": route,
        "count": 0,
        "errors": 0,
        "client_errors": 0,
        "total_ms": 0.0,
        "max_ms": 0.0,
        "last_status": status_code,
        "last_ms": duration_ms,
        "last_seen": now,
        "_durations": deque(maxlen=_MAX_DURATIONS_PER_ENDPOINT),
    }


def _bump_endpoint(
    endpoints: dict[str, dict[str, Any]],
    key: str,
    method: str,
    route: str,
    status_code: int,
    duration_ms: float,
    is_error: bool,
    now: str,
) -> None:
    ep = endpoints.get(key)
    if ep is None:
        ep = _empty_endpoint(method, route, status_code, duration_ms, now)
        endpoints[key] = ep

    ep["count"] += 1
    ep["total_ms"] += duration_ms
    ep["max_ms"] = max(ep["max_ms"], duration_ms)
    ep["last_status"] = status_code
    ep["last_ms"] = duration_ms
    ep["last_seen"] = now
    ep["_durations"].append(duration_ms)
    if is_error:
        ep["errors"] += 1
    elif 400 <= status_code < 500:
        ep["client_errors"] += 1


def _serialize_endpoints(endpoints: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for key, ep in endpoints.items():
        durations = sorted(ep["_durations"])
        p95 = _percentile(durations, 95)
        avg = ep["total_ms"] / ep["count"] if ep["count"] else 0.0
        rows.append({
            "key": key,
            "method": ep["method"],
            "route": ep["route"],
            "count": ep["count"],
            "errors": ep["errors"],
            "client_errors": ep["client_errors"],
            "error_rate": round(ep["errors"] / ep["count"] * 100, 1) if ep["count"] else 0.0,
            "avg_ms": round(avg, 1),
            "p95_ms": round(p95, 1),
            "max_ms": round(ep["max_ms"], 1),
            "last_status": ep["last_status"],
            "last_ms": round(ep["last_ms"], 1),
            "last_seen": ep["last_seen"],
        })
    rows.sort(key=lambda e: e["count"], reverse=True)
    return rows


def _client_bucket_snapshot(bucket: dict[str, Any]) -> dict[str, Any]:
    total = bucket["total"]
    errors = bucket["errors"]
    return {
        "total_requests": total,
        "total_errors": errors,
        "error_rate": round(errors / total * 100, 1) if total else 0.0,
        "endpoints": _serialize_endpoints(bucket["endpoints"]),
    }


class _MetricsStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._started_at = time.time()
        self._endpoints: dict[str, dict[str, Any]] = {}
        self._recent_errors: deque[dict[str, Any]] = deque(maxlen=_MAX_RECENT_ERRORS)
        self._total = 0
        self._errors = 0
        self._by_client: dict[str, dict[str, Any]] = {
            c: {"total": 0, "errors": 0, "endpoints": {}} for c in _CLIENTS
        }

    def record(
        self,
        method: str,
        route: str,
        path: str,
        status_code: int,
        duration_ms: float,
        error_message: str | None = None,
        client: str = CLIENT_OTHER,
    ) -> None:
        if client not in _CLIENTS:
            client = CLIENT_OTHER
        key = f"{method} {route}"
        is_error = status_code >= 500 or status_code == 0
        now = datetime.now(timezone.utc).isoformat()

        with self._lock:
            self._total += 1
            if is_error:
                self._errors += 1

            _bump_endpoint(
                self._endpoints, key, method, route, status_code, duration_ms, is_error, now
            )

            bucket = self._by_client[client]
            bucket["total"] += 1
            if is_error:
                bucket["errors"] += 1
            _bump_endpoint(
                bucket["endpoints"], key, method, route, status_code, duration_ms, is_error, now
            )

            if is_error or (400 <= status_code < 500):
                self._recent_errors.appendleft({
                    "time": now,
                    "method": method,
                    "path": path,
                    "route": route,
                    "status": status_code,
                    "duration_ms": round(duration_ms, 1),
                    "message": (error_message or "")[:400],
                    "client": client,
                })

    def reset(self) -> None:
        with self._lock:
            self._endpoints.clear()
            self._recent_errors.clear()
            self._total = 0
            self._errors = 0
            self._started_at = time.time()
            self._by_client = {
                c: {"total": 0, "errors": 0, "endpoints": {}} for c in _CLIENTS
            }

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            endpoints = _serialize_endpoints(self._endpoints)
            error_rate = round(self._errors / self._total * 100, 1) if self._total else 0.0
            by_client = {
                name: _client_bucket_snapshot(bucket)
                for name, bucket in self._by_client.items()
            }

            return {
                "uptime_seconds": int(time.time() - self._started_at),
                "since": datetime.fromtimestamp(self._started_at, timezone.utc).isoformat(),
                "total_requests": self._total,
                "total_errors": self._errors,
                "error_rate": error_rate,
                "endpoints": endpoints,
                "recent_errors": list(self._recent_errors),
                "by_client": by_client,
            }


def _percentile(sorted_values: list[float], pct: int) -> float:
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = (len(sorted_values) - 1) * (pct / 100)
    lo = int(k)
    hi = min(lo + 1, len(sorted_values) - 1)
    frac = k - lo
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * frac


def detect_client(request) -> str:
    """Identifie le client via X-Client-App, avec repli User-Agent."""
    raw = (request.META.get("HTTP_X_CLIENT_APP") or "").strip().lower()
    if raw in ("toghinis-mobile", "mobile", "expo", "react-native"):
        return CLIENT_MOBILE
    if raw in ("toghinis-web", "web", "frontend"):
        return CLIENT_WEB

    ua = (request.META.get("HTTP_USER_AGENT") or "").lower()
    if any(token in ua for token in ("okhttp", "expo", "reactnative", "react-native", "dalvik")):
        return CLIENT_MOBILE
    return CLIENT_OTHER


# Instance unique partagée par le middleware et les vues.
metrics = _MetricsStore()

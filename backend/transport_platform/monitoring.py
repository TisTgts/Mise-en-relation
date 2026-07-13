"""
Collecte en mémoire des métriques de trafic API.

Objectif : donner au super administrateur une vue « santé » de la plateforme
(volume de requêtes, taux d'erreur, latence par endpoint, dernières erreurs)
sans dépendance externe.

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


class _MetricsStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._started_at = time.time()
        self._endpoints: dict[str, dict[str, Any]] = {}
        self._recent_errors: deque[dict[str, Any]] = deque(maxlen=_MAX_RECENT_ERRORS)
        self._total = 0
        self._errors = 0

    def record(
        self,
        method: str,
        route: str,
        path: str,
        status_code: int,
        duration_ms: float,
        error_message: str | None = None,
    ) -> None:
        key = f"{method} {route}"
        is_error = status_code >= 500 or status_code == 0
        now = datetime.now(timezone.utc).isoformat()

        with self._lock:
            self._total += 1
            if is_error:
                self._errors += 1

            ep = self._endpoints.get(key)
            if ep is None:
                ep = {
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
                self._endpoints[key] = ep

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

            if is_error or (400 <= status_code < 500):
                self._recent_errors.appendleft({
                    "time": now,
                    "method": method,
                    "path": path,
                    "route": route,
                    "status": status_code,
                    "duration_ms": round(duration_ms, 1),
                    "message": (error_message or "")[:400],
                })

    def reset(self) -> None:
        with self._lock:
            self._endpoints.clear()
            self._recent_errors.clear()
            self._total = 0
            self._errors = 0
            self._started_at = time.time()

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            endpoints = []
            for key, ep in self._endpoints.items():
                durations = sorted(ep["_durations"])
                p95 = _percentile(durations, 95)
                avg = ep["total_ms"] / ep["count"] if ep["count"] else 0.0
                endpoints.append({
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

            endpoints.sort(key=lambda e: e["count"], reverse=True)
            error_rate = round(self._errors / self._total * 100, 1) if self._total else 0.0

            return {
                "uptime_seconds": int(time.time() - self._started_at),
                "since": datetime.fromtimestamp(self._started_at, timezone.utc).isoformat(),
                "total_requests": self._total,
                "total_errors": self._errors,
                "error_rate": error_rate,
                "endpoints": endpoints,
                "recent_errors": list(self._recent_errors),
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


# Instance unique partagée par le middleware et les vues.
metrics = _MetricsStore()

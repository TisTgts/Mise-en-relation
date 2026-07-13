"""Middleware de mesure des requêtes API pour la page santé du super admin."""
from __future__ import annotations

import time

from .monitoring import metrics

_TRACKED_PREFIXES = ("/api/", "/dashboard/")


def _route_of(request) -> str:
    """Motif d'URL stable (sans les IDs) pour agréger les métriques."""
    match = getattr(request, "resolver_match", None)
    if match is not None and match.route:
        return "/" + match.route.lstrip("/")
    return request.path


class ApiMetricsMiddleware:
    """Chronomètre chaque requête API et enregistre statut + latence + erreurs."""

    def __init__(self, get_response):
        self.get_response = get_response

    def _tracked(self, path: str) -> bool:
        return path.startswith(_TRACKED_PREFIXES)

    def __call__(self, request):
        if not self._tracked(request.path):
            return self.get_response(request)

        start = time.perf_counter()
        status_code = 0
        try:
            response = self.get_response(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            # Django convertit les exceptions non gérées en réponse 500 : un seul
            # enregistrement ici suffit (process_exception ne fait que fournir le message).
            metrics.record(
                method=request.method,
                route=_route_of(request),
                path=request.path,
                status_code=status_code,
                duration_ms=duration_ms,
                error_message=getattr(request, "_api_metrics_error", None),
            )

    def process_exception(self, request, exception):
        if self._tracked(request.path):
            request._api_metrics_error = f"{type(exception).__name__}: {exception}"
        return None

"""İstemci IP — nginx / Docker proxy arkasında X-Forwarded-For desteği."""

from __future__ import annotations

import ipaddress

from starlette.requests import Request

from core.config import get_settings


def _normalize_ip(ip: str) -> str:
    ip = ip.strip()
    if ip == "::1":
        return "127.0.0.1"
    return ip


def _ip_in_list(ip: str, entries: str) -> bool:
    ip = _normalize_ip(ip)
    for entry in entries.split(","):
        entry = entry.strip()
        if not entry:
            continue
        try:
            if "/" in entry:
                if ipaddress.ip_address(ip) in ipaddress.ip_network(entry, strict=False):
                    return True
            elif ip == entry:
                return True
        except ValueError:
            continue
    return False


def get_client_ip(request: Request) -> str:
    settings = get_settings()
    direct = _normalize_ip(request.client.host if request.client else "")

    if direct and _ip_in_list(direct, settings.TRUSTED_PROXY_IPS):
        real_ip = request.headers.get("X-Real-IP", "").strip()
        if real_ip:
            return _normalize_ip(real_ip)

        forwarded = request.headers.get("X-Forwarded-For", "").strip()
        if forwarded:
            return _normalize_ip(forwarded.split(",")[0].strip())

    return direct

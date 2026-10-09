import ipaddress

from fastapi import Header, HTTPException, Request
from starlette import status

from core.client_ip import get_client_ip
from core.config import get_settings

settings = get_settings()


def check_admin_enabled():
    if not settings.ADMIN_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin endpoint'leri devre dışı",
        )
    return True


def check_ip_address(request: Request):
    client_ip = get_client_ip(request)

    allowed_ips = settings.ADMIN_ALLOWED_IPS.split(",")
    for allowed_ip in allowed_ips:
        allowed_ip = allowed_ip.strip()
        if not allowed_ip:
            continue
        try:
            if "/" in allowed_ip:
                if ipaddress.ip_address(client_ip) in ipaddress.ip_network(allowed_ip):
                    return True
            else:
                if client_ip == allowed_ip:
                    return True
        except ValueError:
            continue

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"IP adresi {client_ip} izin verilmiyor",
    )


def check_api_key(x_admin_key: str = Header(alias="X-Admin-Key")):
    if x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Geçersiz admin API key",
        )
    return True


async def admin_security_check(
    request: Request,
    x_admin_key: str = Header(alias="X-Admin-Key"),
):
    check_admin_enabled()
    check_ip_address(request)
    check_api_key(x_admin_key)
    return True

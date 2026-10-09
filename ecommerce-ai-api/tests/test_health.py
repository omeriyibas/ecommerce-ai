"""Harness smoke — DB + Redis ayaktayken /health."""

import pytest

pytestmark = pytest.mark.integration


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"]["status"] == "ok"
    assert body["checks"]["redis"]["status"] == "ok"

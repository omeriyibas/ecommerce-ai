"""S3 image upload + delete + short-lived GET URLs."""

from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path
from urllib.parse import unquote

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException
from starlette import status

from core.config import get_settings

logger = logging.getLogger(__name__)


class S3Storage:
    def __init__(self) -> None:
        s = get_settings()
        self._bucket = (s.S3_BUCKET or "").strip()
        self._region = (s.AWS_REGION or "eu-central-1").strip()
        self._prefix = (s.S3_PREFIX or "uploads/").strip() or "uploads/"
        self._presign_expires = s.S3_PRESIGN_EXPIRES_SEC
        access_key = (s.AWS_ACCESS_KEY_ID or "").strip().strip('"').strip("'")
        secret_key = (s.AWS_SECRET_ACCESS_KEY or "").strip().strip('"').strip("'")
        self._client = boto3.client(
            "s3",
            region_name=self._region,
            aws_access_key_id=access_key or None,
            aws_secret_access_key=secret_key or None,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "virtual"},
            ),
        )

    def _require_bucket(self) -> str:
        if not self._bucket:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3_BUCKET yapılandırılmamış",
            )
        return self._bucket

    def build_object_key(self, *, filename: str | None = None) -> str:
        original = Path(filename or "image.jpg").name
        return f"{self._prefix.rstrip('/')}/{uuid.uuid4().hex}_{original}"

    def upload_image(
        self,
        *,
        content: bytes,
        content_type: str,
        filename: str | None = None,
    ) -> str:
        """S3'e yükler; DB'de saklanacak object key döner."""
        bucket = self._require_bucket()
        key = self.build_object_key(filename=filename)
        try:
            self._client.put_object(
                Bucket=bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.exception("S3 upload failed key=%s", key)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="S3 yükleme başarısız",
            ) from exc
        return key

    def generate_presigned_url(self, key: str) -> str:
        key = unquote((key or "").strip().lstrip("/"))
        if not key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dosya bulunamadı",
            )
        bucket = self._require_bucket()
        try:
            return self._client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=self._presign_expires,
                HttpMethod="GET",
            )
        except (BotoCoreError, ClientError) as exc:
            logger.exception("S3 presign failed key=%s", key)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Görüntü bağlantısı oluşturulamadı",
            ) from exc

    def presigned_get_url(self, *, stored: str) -> str:
        return self.generate_presigned_url(stored)

    def delete_object(self, key: str) -> None:
        key = unquote((key or "").strip().lstrip("/"))
        if not key:
            return
        bucket = self._require_bucket()
        try:
            self._client.delete_object(Bucket=bucket, Key=key)
        except (BotoCoreError, ClientError) as exc:
            logger.exception("S3 delete failed key=%s", key)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="S3 silme başarısız",
            ) from exc

    async def aupload_image(
        self,
        *,
        content: bytes,
        content_type: str,
        filename: str | None = None,
    ) -> str:
        return await asyncio.to_thread(
            self.upload_image,
            content=content,
            content_type=content_type,
            filename=filename,
        )

    async def apresigned_get_url(self, *, stored: str) -> str:
        return await asyncio.to_thread(self.presigned_get_url, stored=stored)

    async def adelete_object(self, key: str) -> None:
        await asyncio.to_thread(self.delete_object, key)


_s3: S3Storage | None = None


def get_s3_storage() -> S3Storage:
    global _s3
    if _s3 is None:
        _s3 = S3Storage()
    return _s3

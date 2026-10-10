from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from api_schemas.auth.user import UserResponse
from api_schemas.document import DocumentResponse
from core.config import get_settings
from deps.auth import get_current_user
from deps.db import get_db
from deps.rate_limit import api_rate_limit
from enums.document import DocumentType
from services.rag_service import RagService

router = APIRouter(prefix="/documents", tags=["documents"])

_settings = get_settings()


def get_rag_service(db: AsyncSession = Depends(get_db)) -> RagService:
    return RagService(db=db)


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    svc: RagService = Depends(get_rag_service),
    user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("document_list")),
):
    """Kullanıcının RAG belgelerini listele."""
    return await svc.list_documents(str(user.id))


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    svc: RagService = Depends(get_rag_service),
    user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("document_upload")),
):
    """PDF yükle, parçala ve embed et."""
    filename = (file.filename or "").strip() or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnızca PDF yüklenebilir",
        )

    content = await file.read()
    max_bytes = _settings.UPLOAD_MAX_BYTES
    if max_bytes > 0 and len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dosya en fazla {max_bytes // (1024 * 1024)} MB olabilir",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dosya boş",
        )

    try:
        return await svc.ingest_upload(
            customer_id=str(user.id),
            document_type=document_type,
            filename=filename,
            content=content,
            replace=True,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    svc: RagService = Depends(get_rag_service),
    user: UserResponse = Depends(get_current_user),
    _: None = Depends(api_rate_limit("document_delete")),
):
    """Belgeyi ve chunk'larını sil."""
    ok = await svc.delete_document(str(user.id), document_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belge bulunamadı",
        )

from pydantic import BaseModel, ConfigDict, Field

from enums.document import DocumentType


class DocumentResponse(BaseModel):
    id: int
    name: str
    document_type: DocumentType
    chunk_count: int = Field(ge=0)

    model_config = ConfigDict(from_attributes=True)

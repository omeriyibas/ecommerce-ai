from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    price: float = Field(..., gt=0)
    description: str = Field(default='', max_length=512)


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: str

    model_config = ConfigDict(from_attributes=True)

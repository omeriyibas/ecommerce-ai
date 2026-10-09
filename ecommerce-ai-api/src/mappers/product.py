from api_schemas.product import ProductResponse
from models.product import Product


def product_to_response(row: Product) -> ProductResponse:
    return ProductResponse.model_validate(row)

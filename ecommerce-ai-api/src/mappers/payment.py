from api_schemas.payment import PaymentResponse
from models.payment import Payment


def payment_to_response(row: Payment) -> PaymentResponse:
    return PaymentResponse.model_validate(row)

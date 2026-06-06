from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.order import PaymentProof
from app.schemas.guest_order import (
    GuestOrderEdit,
    GuestOrderEditResponse,
    OrderTrackItemResponse,
    OrderTrackResponse,
    PaymentProofResponse,
    PaymentProofUploadResponse,
)
from app.schemas.public import PublicPaymentMethod, PublicStoreProfile
from app.services import order_access_service
from app.services.exceptions import ServiceError
from app.utils.upload import save_payment_proof_image


async def upload_payment_proof(
    db: Session,
    invoice_code: str,
    password: str,
    file,
) -> PaymentProofUploadResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)
    order_access_service.assert_upload_allowed_status(order)

    try:
        image_url = await save_payment_proof_image(file, order.id)
        proof = PaymentProof(order_id=order.id, image_url=image_url)
        db.add(proof)

        old_status = order.status
        if order.status == OrderStatus.PENDING_PAYMENT:
            order.status = OrderStatus.PAYMENT_UPLOADED
            order_access_service.append_status_history(
                db,
                order=order,
                old_status=old_status,
                new_status=OrderStatus.PAYMENT_UPLOADED,
                note="Payment proof uploaded",
            )

        db.commit()
        db.refresh(proof)
    except ServiceError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return PaymentProofUploadResponse(
        message="Payment proof uploaded",
        order_status=order.status,
        proof=PaymentProofResponse.model_validate(proof),
    )


def track_order(db: Session, invoice_code: str, password: str) -> OrderTrackResponse:
    order = order_access_service.authenticate_order(db, invoice_code, password)

    return OrderTrackResponse(
        order_id=order.id,
        invoice_code=order.invoice_code,
        status=order.status,
        buyer_name=order.buyer_name,
        buyer_phone=order.buyer_phone,
        buyer_address=order.buyer_address,
        buyer_note=order.buyer_note,
        subtotal_amount=order.subtotal_amount,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderTrackItemResponse(
                product_id=item.product_id,
                product_title=item.product_title_snapshot,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                total_price=item.total_price,
            )
            for item in order.items
        ],
        payment_proofs=[PaymentProofResponse.model_validate(p) for p in order.payment_proofs],
        store=PublicStoreProfile.model_validate(order.store),
        payment_method=PublicPaymentMethod.model_validate(order.payment_method),
    )


def edit_order(db: Session, invoice_code: str, data: GuestOrderEdit) -> GuestOrderEditResponse:
    order = order_access_service.authenticate_order(db, invoice_code, data.invoice_edit_password)
    order_access_service.assert_editable_status(order)

    update_data = data.model_dump(exclude_unset=True, exclude={"invoice_edit_password"})
    for field, value in update_data.items():
        setattr(order, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(order)

    return GuestOrderEditResponse(
        message="Order updated",
        order_id=order.id,
        status=order.status,
        buyer_name=order.buyer_name,
        buyer_phone=order.buyer_phone,
        buyer_address=order.buyer_address,
        buyer_note=order.buyer_note,
    )

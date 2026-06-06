import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.services.exceptions import ServiceError

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def _detect_extension_from_magic(header: bytes) -> str | None:
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        return ".gif"
    if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return ".webp"
    return None


def _extension_from_filename(filename: str | None) -> str | None:
    if not filename or "." not in filename:
        return None
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext == ".jpeg":
        ext = ".jpg"
    return ext if ext in ALLOWED_EXTENSIONS else None


def _extensions_compatible(declared: str, detected: str) -> bool:
    normalize = {".jpg", ".jpeg"}
    if declared in normalize and detected in normalize:
        return True
    return declared == detected


async def save_payment_proof_image(file: UploadFile, order_id: int) -> str:
    if not file.filename:
        raise ServiceError("File is required", status_code=422)

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ServiceError("Only image files are allowed", status_code=422)

    ext = _extension_from_filename(file.filename)
    if ext is None:
        raise ServiceError("Invalid image file extension", status_code=422)

    header = await file.read(12)
    if not header:
        raise ServiceError("Empty file", status_code=422)

    magic_ext = _detect_extension_from_magic(header)
    if magic_ext is None or not _extensions_compatible(ext, magic_ext):
        raise ServiceError("Invalid image file content", status_code=422)

    upload_dir = Path(settings.UPLOAD_DIR) / settings.PAYMENT_PROOF_SUBDIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{order_id}_{uuid.uuid4().hex}{magic_ext}"
    destination = upload_dir / filename

    total_size = len(header)
    if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ServiceError("File too large", status_code=422)

    oversize = False
    with destination.open("wb") as output:
        output.write(header)
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                oversize = True
                break
            output.write(chunk)

    if oversize:
        destination.unlink(missing_ok=True)
        raise ServiceError("File too large", status_code=422)

    return f"/uploads/{settings.PAYMENT_PROOF_SUBDIR}/{filename}"

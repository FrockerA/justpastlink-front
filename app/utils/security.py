"""Security utilities shared across the application."""

from secrets import token_urlsafe


def generate_secret_key(length: int = 32) -> str:
    """Generate URL-safe secret key for local development or tests."""
    return token_urlsafe(length)
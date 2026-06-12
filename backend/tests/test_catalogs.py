import os

from pydantic import ValidationError


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/justpastlink_test",
)
os.environ.setdefault("SECRET_KEY", "test-secret")


def test_catalog_routes_are_registered():
    from app.main import app

    paths = {route.path for route in app.routes}

    assert "/catalogs" in paths
    assert "/catalogs/{catalog_id}" in paths
    assert "/catalogs/{catalog_id}/lectures/{video_id}" in paths


def test_catalog_name_is_trimmed_and_normalized():
    from app.schemas.catalog import CatalogCreate

    payload = CatalogCreate(name="  Data   Science  ")

    assert payload.name == "Data Science"


def test_catalog_name_cannot_be_blank():
    from app.schemas.catalog import CatalogCreate

    try:
        CatalogCreate(name="   ")
    except ValidationError:
        return

    raise AssertionError("Blank catalog names must be rejected")

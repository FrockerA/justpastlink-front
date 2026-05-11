import os


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/justpastlink_test",
)
os.environ.setdefault("SECRET_KEY", "test-secret")


def test_auth_routes_are_registered():
    from app.main import app

    paths = {route.path for route in app.routes}

    assert "/auth/register" in paths
    assert "/auth/login" in paths
    assert "/auth/me" in paths

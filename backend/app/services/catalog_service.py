from sqlalchemy.orm import Session

from app.models.catalog import Catalog
from app.models.lecture import Lecture
from app.models.video import Video
from app.repositories.catalog_repository import CatalogRepository
from app.schemas.catalog import CatalogLectureResponse, CatalogResponse


class CatalogNameConflictError(ValueError):
    pass


def _serialize_catalog(catalog: Catalog) -> CatalogResponse:
    lectures = []
    for link in catalog.lecture_links:
        lecture = link.lecture
        video = lecture.video
        lectures.append(
            CatalogLectureResponse(
                video_id=lecture.video_id,
                title=lecture.title or video.original_filename,
                video_title=video.original_filename,
                summary=lecture.summary,
                added_at=link.created_at,
            )
        )

    return CatalogResponse(
        id=catalog.id,
        name=catalog.name,
        created_at=catalog.created_at,
        updated_at=catalog.updated_at,
        lectures=lectures,
    )


def list_catalogs(db: Session, user_id: int) -> list[CatalogResponse]:
    return [
        _serialize_catalog(catalog)
        for catalog in CatalogRepository(db).list_for_user(user_id)
    ]


def get_catalog(db: Session, catalog_id: int, user_id: int) -> Catalog | None:
    return CatalogRepository(db).get_for_user(catalog_id, user_id)


def create_catalog(db: Session, user_id: int, name: str) -> CatalogResponse:
    repository = CatalogRepository(db)
    if repository.find_by_name(user_id, name):
        raise CatalogNameConflictError("A catalog with this name already exists")

    return _serialize_catalog(repository.create(user_id, name))


def rename_catalog(
    db: Session,
    catalog: Catalog,
    name: str,
) -> CatalogResponse:
    repository = CatalogRepository(db)
    if repository.find_by_name(catalog.user_id, name, exclude_catalog_id=catalog.id):
        raise CatalogNameConflictError("A catalog with this name already exists")

    return _serialize_catalog(repository.update(catalog, name))


def delete_catalog(db: Session, catalog: Catalog) -> None:
    CatalogRepository(db).delete(catalog)


def add_lecture_to_catalog(
    db: Session,
    catalog: Catalog,
    video_id: int,
    user_id: int,
) -> CatalogResponse | None:
    lecture = (
        db.query(Lecture)
        .join(Video, Lecture.video_id == Video.id)
        .filter(Lecture.video_id == video_id, Video.user_id == user_id)
        .first()
    )
    if not lecture:
        return None

    repository = CatalogRepository(db)
    repository.add_lecture(catalog, lecture.id)
    refreshed = repository.get_for_user(catalog.id, user_id)
    return _serialize_catalog(refreshed)


def remove_lecture_from_catalog(
    db: Session,
    catalog: Catalog,
    video_id: int,
    user_id: int,
) -> CatalogResponse | None:
    lecture = (
        db.query(Lecture)
        .join(Video, Lecture.video_id == Video.id)
        .filter(Lecture.video_id == video_id, Video.user_id == user_id)
        .first()
    )
    if not lecture:
        return None

    repository = CatalogRepository(db)
    repository.remove_lecture(catalog, lecture.id)
    refreshed = repository.get_for_user(catalog.id, user_id)
    return _serialize_catalog(refreshed)

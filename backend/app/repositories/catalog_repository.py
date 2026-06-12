from sqlalchemy.orm import Session, joinedload

from app.models.catalog import Catalog, CatalogLecture
from app.models.lecture import Lecture


class CatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: int) -> list[Catalog]:
        return (
            self.db.query(Catalog)
            .options(
                joinedload(Catalog.lecture_links)
                .joinedload(CatalogLecture.lecture)
                .joinedload(Lecture.video)
            )
            .filter(Catalog.user_id == user_id)
            .order_by(Catalog.created_at.asc(), Catalog.id.asc())
            .all()
        )

    def get_for_user(self, catalog_id: int, user_id: int) -> Catalog | None:
        return (
            self.db.query(Catalog)
            .options(
                joinedload(Catalog.lecture_links)
                .joinedload(CatalogLecture.lecture)
                .joinedload(Lecture.video)
            )
            .filter(Catalog.id == catalog_id, Catalog.user_id == user_id)
            .first()
        )

    def find_by_name(
        self,
        user_id: int,
        name: str,
        exclude_catalog_id: int | None = None,
    ) -> Catalog | None:
        query = self.db.query(Catalog).filter(
            Catalog.user_id == user_id,
            Catalog.name.ilike(name),
        )
        if exclude_catalog_id is not None:
            query = query.filter(Catalog.id != exclude_catalog_id)
        return query.first()

    def create(self, user_id: int, name: str) -> Catalog:
        catalog = Catalog(user_id=user_id, name=name)
        self.db.add(catalog)
        self.db.commit()
        return self.get_for_user(catalog.id, user_id)

    def update(self, catalog: Catalog, name: str) -> Catalog:
        catalog.name = name
        self.db.add(catalog)
        self.db.commit()
        return self.get_for_user(catalog.id, catalog.user_id)

    def delete(self, catalog: Catalog) -> None:
        self.db.delete(catalog)
        self.db.commit()

    def add_lecture(self, catalog: Catalog, lecture_id: int) -> None:
        existing = (
            self.db.query(CatalogLecture)
            .filter(
                CatalogLecture.catalog_id == catalog.id,
                CatalogLecture.lecture_id == lecture_id,
            )
            .first()
        )
        if existing:
            return

        self.db.add(CatalogLecture(catalog_id=catalog.id, lecture_id=lecture_id))
        self.db.commit()

    def remove_lecture(self, catalog: Catalog, lecture_id: int) -> bool:
        link = (
            self.db.query(CatalogLecture)
            .filter(
                CatalogLecture.catalog_id == catalog.id,
                CatalogLecture.lecture_id == lecture_id,
            )
            .first()
        )
        if not link:
            return False

        self.db.delete(link)
        self.db.commit()
        return True

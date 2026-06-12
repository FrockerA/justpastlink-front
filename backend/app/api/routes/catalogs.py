from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.catalog import CatalogCreate, CatalogResponse, CatalogUpdate
from app.services.catalog_service import (
    CatalogNameConflictError,
    add_lecture_to_catalog,
    create_catalog,
    delete_catalog,
    get_catalog,
    list_catalogs,
    remove_lecture_from_catalog,
    rename_catalog,
)

router = APIRouter(prefix="/catalogs", tags=["Catalogs"])


@router.get("", response_model=list[CatalogResponse])
@router.get("/", response_model=list[CatalogResponse], include_in_schema=False)
def read_catalogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_catalogs(db, current_user.id)


@router.post("", response_model=CatalogResponse, status_code=status.HTTP_201_CREATED)
@router.post(
    "/",
    response_model=CatalogResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_user_catalog(
    payload: CatalogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_catalog(db, current_user.id, payload.name)
    except CatalogNameConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/{catalog_id}", response_model=CatalogResponse)
def update_user_catalog(
    catalog_id: int,
    payload: CatalogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    catalog = get_catalog(db, catalog_id, current_user.id)
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")

    try:
        return rename_catalog(db, catalog, payload.name)
    except CatalogNameConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.delete("/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_catalog(
    catalog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    catalog = get_catalog(db, catalog_id, current_user.id)
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")

    delete_catalog(db, catalog)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{catalog_id}/lectures/{video_id}", response_model=CatalogResponse)
def add_catalog_lecture(
    catalog_id: int,
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    catalog = get_catalog(db, catalog_id, current_user.id)
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")

    updated = add_lecture_to_catalog(
        db,
        catalog,
        video_id=video_id,
        user_id=current_user.id,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Processed lecture not found")
    return updated


@router.delete("/{catalog_id}/lectures/{video_id}", response_model=CatalogResponse)
def remove_catalog_lecture(
    catalog_id: int,
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    catalog = get_catalog(db, catalog_id, current_user.id)
    if not catalog:
        raise HTTPException(status_code=404, detail="Catalog not found")

    updated = remove_lecture_from_catalog(
        db,
        catalog,
        video_id=video_id,
        user_id=current_user.id,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Processed lecture not found")
    return updated

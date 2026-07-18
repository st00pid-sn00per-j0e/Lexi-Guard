from celery import Celery

from app.config import settings

celery_app = Celery(
    "lexiguard",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

if settings.CELERY_TASK_ALWAYS_EAGER:
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

celery_app.autodiscover_tasks(["app.tasks"])

import app.tasks.analyze_contract  # noqa: E402, F401

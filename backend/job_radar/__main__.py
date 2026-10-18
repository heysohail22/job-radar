import uvicorn
from .config import Settings
from .app import create_app


def main():
    settings = Settings()
    uvicorn.run(
        create_app(settings),
        host=settings.host,
        port=settings.port,
        workers=1,
        proxy_headers=False,
        timeout_graceful_shutdown=90,
    )


if __name__ == "__main__":
    main()

@echo off
REM Скрипт для создания миграций Alembic (Windows)
REM Использование: make-migration.bat "описание миграции"

if "%1"=="" (
    echo Ошибка: необходимо указать описание миграции
    echo Использование: %0 "описание миграции"
    exit /b 1
)

echo Создание миграции с описанием: %1
docker-compose run --rm migrations alembic revision --autogenerate -m "%1"

if %errorlevel% equ 0 (
    echo Миграция успешно создана!
    echo Для применения миграций выполните: docker-compose up migrations
) else (
    echo Ошибка при создании миграции
    exit /b 1
)
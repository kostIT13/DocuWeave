#!/bin/bash
# Скрипт для создания миграций Alembic
# Использование: ./make-migration.sh "описание миграции"

if [ -z "$1" ]; then
    echo "Ошибка: необходимо указать описание миграции"
    echo "Использование: $0 \"описание миграции\""
    exit 1
fi

echo "Создание миграции с описанием: $1"
docker-compose run --rm migrations alembic revision --autogenerate -m "$1"

if [ $? -eq 0 ]; then
    echo "Миграция успешно создана!"
    echo "Для применения миграций выполните: docker-compose up migrations"
else
    echo "Ошибка при создании миграции"
    exit 1
fi
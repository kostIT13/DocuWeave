#!/bin/bash
# Скрипт для инициализации Ollama и загрузки моделей

set -e

echo "Ожидание запуска Ollama..."
sleep 10

# Проверка доступности Ollama
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "Ollama доступен"
        break
    fi
    echo "Ожидание Ollama... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Ошибка: Ollama не запустился за отведенное время"
    exit 1
fi

# Модели для загрузки
EMBEDDING_MODEL="nomic-embed-text"
LLM_MODEL="qwen2.5:7b"

echo "Загрузка модели для эмбеддингов: $EMBEDDING_MODEL"
if ! ollama pull $EMBEDDING_MODEL; then
    echo "Предупреждение: не удалось загрузить модель эмбеддингов $EMBEDDING_MODEL"
    echo "Попытка использовать альтернативную модель..."
    ollama pull all-minilm
fi

echo "Загрузка LLM модели: $LLM_MODEL"
if ! ollama pull $LLM_MODEL; then
    echo "Предупреждение: не удалось загрузить LLM модель $LLM_MODEL"
    echo "Попытка использовать альтернативную модель..."
    ollama pull llama3.2:3b
fi

# Проверка загруженных моделей
echo "Проверка загруженных моделей..."
ollama list

echo "Инициализация Ollama завершена успешно"

# Запуск Ollama в фоновом режиме (если скрипт используется как entrypoint)
if [ "$1" = "serve" ]; then
    echo "Запуск Ollama сервера..."
    exec ollama serve
fi
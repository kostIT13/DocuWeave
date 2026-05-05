# DocuWeave

Веб-приложение для работы с документами с использованием RAG (Retrieval-Augmented Generation) и интеллектуальных агентов на основе LangGraph.

## Стек технологий

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **AI/ML**: LangChain, LangGraph, Ollama, ChromaDB
- **Базы данных**: PostgreSQL (реляционная), ChromaDB (векторная)
- **Инфраструктура**: Docker, Docker Compose
- **Аутентификация**: JWT токены
- **Документы**: Поддержка PDF, DOCX, TXT

## Архитектура

### Модули
1. **RAG система**: Модульная архитектура с разделением на Indexer, Retriever, Generator, Orchestrator
2. **Агентная система**: Интеллектуальный агент на LangGraph с инструментами для анализа документов
3. **API**: RESTful API с эндпоинтами для документов, чатов, проектов и агента
4. **Базы данных**: PostgreSQL для метаданных, ChromaDB для векторных эмбеддингов

### Ключевые компоненты
- **UnifiedOllamaClient**: Единый клиент для работы с моделями Ollama
- **AgentOrchestrator**: Координатор работы агента с интеграцией RAG
- **RAGOrchestrator**: Управление полным RAG пайплайном
- **DocumentProcessor**: Обработка и чанкирование документов

## Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- 16+ GB RAM (для работы моделей Ollama)
- Git

### Установка и запуск

1. **Клонирование репозитория**
   ```bash
   git clone <repository-url>
   cd DocuWeave
   ```

2. **Настройка переменных окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env при необходимости
   ```

3. **Запуск всех сервисов**
   ```bash
   docker-compose up -d
   ```

4. **Проверка работоспособности**
   - Backend API: http://localhost:8000/docs
   - ChromaDB: http://localhost:8001
   - Ollama: http://localhost:11434

5. **Инициализация базы данных** (выполняется автоматически)
   ```bash
   docker-compose run migrations
   ```

## Сервисы Docker Compose

### 1. Backend (FastAPI)
- **Порт**: 8000
- **Зависимости**: PostgreSQL, ChromaDB, Ollama
- **Переменные окружения**: Настройки LLM, RAG, базы данных
- **Особенности**: Автоматическая перезагрузка при изменении кода

### 2. PostgreSQL
- **Порт**: 5432
- **Данные**: Сохраняются в volume `postgres_data`
- **Здоровье**: Проверка доступности через healthcheck

### 3. ChromaDB
- **Порт**: 8001
- **Данные**: Сохраняются в volume `chroma_data`
- **Использование**: Векторное хранилище для эмбеддингов документов

### 4. Ollama
- **Порт**: 11434
- **Модели**: Автоматическая загрузка при запуске (nomic-embed-text, qwen2.5:7b)
- **Память**: Ограничение 16GB для работы с большими моделями
- **Инициализация**: Скрипт `backend/scripts/init-ollama.sh`

## API Эндпоинты

### Агент
- `POST /agent/query` - Обработка запроса через интеллектуального агента
- `POST /agent/query/rag-fallback` - Обработка с fallback на RAG
- `POST /agent/analyze-document` - Анализ документа инструментами агента
- `POST /agent/batch-process` - Пакетная обработка запросов
- `GET /agent/info` - Информация о конфигурации агента
- `GET /agent/health` - Проверка здоровья агента

### Документы
- `POST /documents/upload` - Загрузка документа
- `DELETE /documents/{document_id}` - Удаление документа
- `GET /documents` - Список документов проекта

### Чат
- `POST /chat/sessions` - Создание сессии чата
- `POST /chat/{chat_id}/messages` - Отправка сообщения
- `GET /chat/{chat_id}/messages/stream` - Потоковое получение ответа

### Проекты
- `GET /projects` - Список проектов пользователя
- `POST /projects` - Создание проекта
- `PATCH /projects/{project_id}` - Обновление настроек проекта

## Агентная система

### Инструменты агента
1. **rag_search** - Поиск релевантных документов в векторной базе
2. **document_analysis** - Анализ документа (суммаризация, ключевые точки и т.д.)
3. **summarize** - Суммаризация текста
4. **extract_entities** - Извлечение сущностей из текста
5. **answer_with_context** - Ответ на вопрос на основе контекста
6. **classify_query** - Классификация запроса пользователя

### Граф агента
1. **classify_query** - Классификация запроса и определение маршрута
2. **rag_search** - Поиск релевантных документов (если нужно)
3. **call_tools** - Вызов соответствующих инструментов
4. **generate_response** - Генерация финального ответа
5. **finalize** - Подготовка результата и логирование

## Конфигурация

### Переменные окружения (.env)
```bash
# База данных
POSTGRES_DB=Mydatabase123
POSTGRES_HOST=db
POSTGRES_PASSWORD=Mypass123
POSTGRES_USER=Myuser123

# Ollama
OLLAMA_HOST=http://ollama:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=qwen2.5:7b

# ChromaDB
CHROMA_HOST=chromadb
CHROMA_PORT=8000

# Агент
AGENT_ENABLED=true
AGENT_MAX_STEPS=10
```

### Настройка моделей Ollama
По умолчанию используются:
- **Модель эмбеддингов**: `nomic-embed-text` (для векторных поисков)
- **LLM модель**: `llama3.2:3b` (для генерации ответов)

Для изменения моделей:
1. Отредактируйте `OLLAMA_EMBEDDING_MODEL` и `OLLAMA_LLM_MODEL` в `.env`
2. Перезапустите сервис Ollama: `docker-compose restart ollama`

## Разработка

### Локальная разработка
```bash
# Установка зависимостей
cd backend
uv sync

# Запуск миграций
alembic upgrade head

# Запуск сервера разработки
uvicorn src.main:app --reload
```

### Тестирование
```bash
# Запуск тестов
cd backend
pytest tests/

# Запуск конкретных тестов агента
pytest tests/test_agent.py -v
```

### Структура проекта
```
DocuWeave/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── api/            # API эндпоинты
│   │   ├── services/       # Бизнес-логика
│   │   │   ├── agent/      # Агентная система
│   │   │   ├── rag/        # RAG система
│   │   │   └── llm/        # LLM сервисы
│   │   ├── infrastructure/ # Инфраструктура
│   │   └── prompts/        # Промпты
│   ├── alembic/            # Миграции базы данных
│   ├── scripts/            # Скрипты инициализации
│   └── tests/              # Тесты
├── frontend/               # Frontend приложение
├── uploads/                # Загруженные документы
└── docker-compose.yml      # Docker Compose конфигурация
```

## Мониторинг и логи

### Логирование
- **Backend**: Логи в stdout с уровнем `LOG_LEVEL` из .env
- **Ollama**: Логи доступны через `docker-compose logs ollama`
- **Базы данных**: Логи доступны через соответствующие контейнеры

### Health checks
- **Backend**: `GET /health`
- **Agent**: `GET /agent/health`
- **ChromaDB**: Автоматическая проверка в docker-compose
- **PostgreSQL**: Автоматическая проверка в docker-compose

## Устранение неполадок

### Проблемы с памятью
Если Ollama не хватает памяти:
1. Увеличьте лимиты памяти в `docker-compose.yml` (раздел `deploy.resources`)
2. Используйте меньшие модели (например, `llama3.2:3b` вместо `qwen2.5:7b`)

### Проблемы с загрузкой моделей
Если модели не загружаются:
1. Проверьте доступность Ollama: `curl http://localhost:11434/api/tags`
2. Загрузите модели вручную: `docker-compose exec ollama ollama pull qwen2.5:7b`
3. Проверьте логи: `docker-compose logs ollama`

### Проблемы с подключением к базам данных
1. Проверьте, что все сервисы запущены: `docker-compose ps`
2. Проверьте логи миграций: `docker-compose logs migrations`
3. Убедитесь, что переменные окружения корректны

# DocuWeave Backend

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Backend-часть приложения DocuWeave, предоставляющая RESTful API для работы с документами, интеллектуальными агентами и RAG-системой.

## 🚀 Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Python 3.12+ (для локальной разработки)
- UV (современный менеджер пакетов Python)

### Запуск с Docker Compose
```bash
# Клонируйте репозиторий (если еще не сделали)
git clone <repository-url>
cd DocuWeave

# Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env при необходимости

# Запустите все сервисы
docker-compose up -d
```

После запуска сервисы будут доступны:
- **Backend API**: http://localhost:8000/docs (Swagger UI)
- **ChromaDB**: http://localhost:8001
- **Ollama**: http://localhost:11434
- **PostgreSQL**: localhost:5432

## 📁 Структура проекта

```
backend/
├── src/
│   ├── api/                    # API эндпоинты
│   │   ├── agent/             # Эндпоинты интеллектуального агента
│   │   ├── auth/              # Аутентификация и авторизация
│   │   ├── chat/              # Чат-сессии и сообщения
│   │   ├── document/          # Управление документами
│   │   └── project/           # Проекты и настройки
│   ├── services/              # Бизнес-логика
│   │   ├── agent/             # Агентная система на LangGraph
│   │   ├── rag/               # RAG система (индексация, поиск, генерация)
│   │   ├── llm/               # Сервисы работы с LLM (Ollama)
│   │   ├── document/          # Обработка документов
│   │   ├── chat_session/      # Управление чат-сессиями
│   │   ├── project/           # Управление проектами
│   │   ├── auth/              # Сервисы аутентификации
│   │   └── user/              # Управление пользователями
│   ├── infrastructure/        # Инфраструктурный слой
│   │   ├── models/            # SQLAlchemy модели
│   │   ├── core/              # Конфигурация, база данных, логирование
│   │   └── utils/             # Вспомогательные утилиты
│   ├── prompts/               # Промпты для LLM
│   ├── lifespan.py            # Жизненный цикл приложения
│   └── main.py                # Точка входа FastAPI
├── alembic/                   # Миграции базы данных
├── scripts/                   # Скрипты инициализации
├── tests/                     # Тесты
├── Dockerfile                 # Docker образ
├── pyproject.toml             # Зависимости и конфигурация
└── requirements.txt           # Зависимости (для совместимости)
```

## 🛠️ Технологический стек

### Основные технологии
- **FastAPI** - современный, быстрый веб-фреймворк для Python
- **SQLAlchemy 2.0** - ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных
- **ChromaDB** - векторная база данных для эмбеддингов
- **Ollama** - локальный запуск LLM моделей
- **LangChain & LangGraph** - фреймворки для построения цепочек и графов агентов
- **Pydantic v2** - валидация данных и сериализация
- **Alembic** - управление миграциями базы данных

### Зависимости
Основные зависимости перечислены в `pyproject.toml`:
- `fastapi>=0.136.0` - веб-фреймворк
- `langchain>=1.2.15` - фреймворк для LLM приложений
- `langgraph>=1.1.9` - построение графов агентов
- `chromadb>=1.5.8` - векторная база данных
- `ollama>=0.6.1` - клиент для Ollama API
- `sqlalchemy>=2.0.49` - ORM
- `asyncpg>=0.31.0` - асинхронный драйвер PostgreSQL
- `pydantic[email]>=2.13.3` - валидация данных

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env` на основе `.env.example`:

```bash
# База данных PostgreSQL
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

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Логирование
LOG_LEVEL=INFO
```

### Настройка моделей Ollama
По умолчанию используются:
- **Модель эмбеддингов**: `nomic-embed-text` (1536 размерность)
- **LLM модель**: `qwen2.5:7b` (7 миллиардов параметров)

Для изменения моделей:
1. Отредактируйте `OLLAMA_EMBEDDING_MODEL` и `OLLAMA_LLM_MODEL` в `.env`
2. Перезапустите сервис Ollama: `docker-compose restart ollama`
3. Убедитесь, что модель загружена: `docker-compose exec ollama ollama pull <model-name>`

## 📡 API Эндпоинты

### Агент
- `POST /agent/query` - Обработка запроса через интеллектуального агента
- `POST /agent/query/rag-fallback` - Обработка с fallback на RAG
- `POST /agent/analyze-document` - Анализ документа инструментами агента
- `POST /agent/batch-process` - Пакетная обработка запросов
- `GET /agent/info` - Информация о конфигурации агента
- `GET /agent/health` - Проверка здоровья агента

### Документы
- `POST /documents/upload` - Загрузка документа (PDF, DOCX, TXT)
- `DELETE /documents/{document_id}` - Удаление документа
- `GET /documents` - Список документов проекта
- `GET /documents/{document_id}` - Получение метаданных документа

### Чат
- `POST /chat/sessions` - Создание сессии чата
- `GET /chat/sessions` - Список сессий пользователя
- `POST /chat/{chat_id}/messages` - Отправка сообщения
- `GET /chat/{chat_id}/messages/stream` - Потоковое получение ответа
- `GET /chat/{chat_id}/messages` - История сообщений

### Проекты
- `GET /projects` - Список проектов пользователя
- `POST /projects` - Создание проекта
- `PATCH /projects/{project_id}` - Обновление настроек проекта
- `DELETE /projects/{project_id}` - Удаление проекта

### Аутентификация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход и получение JWT токена
- `POST /auth/refresh` - Обновление токена
- `GET /auth/me` - Информация о текущем пользователе

## 🤖 Агентная система

### Архитектура агента
Агент построен на **LangGraph** и состоит из следующих узлов:

1. **classify_query** - Классификация запроса пользователя
2. **rag_search** - Поиск релевантных документов в векторной базе
3. **call_tools** - Вызов соответствующих инструментов
4. **generate_response** - Генерация финального ответа
5. **finalize** - Подготовка результата и логирование

### Инструменты агента
1. **rag_search** - Поиск релевантных документов в векторной базе
2. **document_analysis** - Анализ документа (суммаризация, ключевые точки)
3. **summarize** - Суммаризация текста
4. **extract_entities** - Извлечение сущностей из текста
5. **answer_with_context** - Ответ на вопрос на основе контекста
6. **classify_query** - Классификация запроса пользователя

### Конфигурация графа
Граф агента настраивается в `src/services/agent/graph.py`:
- Максимальное количество шагов: `AGENT_MAX_STEPS` (по умолчанию 10)
- Включение/отключение: `AGENT_ENABLED`
- Интеграция с RAG системой

## 🔍 RAG система

### Компоненты RAG
1. **DocumentProcessor** - Обработка и чанкирование документов
2. **Indexer** - Индексация документов в ChromaDB
3. **Retriever** - Поиск релевантных чанков
4. **Generator** - Генерация ответов на основе контекста
5. **RAGOrchestrator** - Координация всего пайплайна

### Поддерживаемые форматы документов
- PDF (.pdf)
- Word документы (.docx)
- Текстовые файлы (.txt)
- Markdown (.md)

### Процесс обработки
1. Загрузка документа через API
2. Извлечение текста и метаданных
3. Чанкирование с перекрытием (chunk_size=1000, overlap=200)
4. Генерация эмбеддингов через Ollama
5. Сохранение в ChromaDB с метаданными

## 🗄️ База данных

### Модели данных
- **User** - Пользователи системы
- **Project** - Проекты пользователей
- **Document** - Загруженные документы
- **ChatSession** - Сессии чата
- **Message** - Сообщения в чате
- **GraphTrace** - Трассировка работы агента
- **ProjectSettingsHistory** - История изменений настроек проекта

### Миграции
Используется **Alembic** для управления миграциями:

```bash
# Создание новой миграции
docker-compose run --rm migrations alembic revision --autogenerate -m "описание изменений"

# Применение миграций
docker-compose up migrations

# Откат последней миграции
docker-compose run --rm migrations alembic downgrade -1

# Просмотр истории
docker-compose run --rm migrations alembic history
```

## 🧪 Разработка

### Локальная разработка без Docker
```bash
# Установка UV (если еще не установлен)
pip install uv

# Установка зависимостей
cd backend
uv sync

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env для локальной разработки

# Запуск миграций
alembic upgrade head

# Запуск сервера разработки
uvicorn src.main:app --reload
```

### Тестирование
```bash
# Запуск всех тестов
pytest tests/

# Запуск с покрытием
pytest --cov=src tests/

# Запуск конкретных тестов
pytest tests/test_agent.py -v
pytest tests/test_rag.py -v
```

### Форматирование кода
```bash
# Автоматическое форматирование
ruff format src/

# Проверка стиля
ruff check src/

# Сортировка импортов
ruff check --select I --fix src/
```

## 🐳 Docker

### Сборка образа
```bash
docker build -t docuweave-backend:latest ./backend
```

### Запуск в Docker Compose
```bash
# Запуск только backend с зависимостями
docker-compose up backend db chromadb ollama

# Просмотр логов
docker-compose logs -f backend

# Остановка всех сервисов
docker-compose down
```

### Health checks
- **Backend**: `GET /health` (возвращает статус всех зависимостей)
- **Agent**: `GET /agent/health` (проверка доступности агента)
- **Базы данных**: Автоматические проверки в docker-compose

## 📊 Мониторинг и логи

### Логирование
Настроено структурированное логирование через `logging_settings.py`:
- Уровень логирования: `LOG_LEVEL` из .env
- Формат: JSON для продакшена, читаемый для разработки
- Контекст: request_id, user_id, agent_trace_id

### Трассировка агента
Каждый вызов агента записывается в `GraphTrace` с:
- Входными параметрами
- Выполненными шагами
- Использованными инструментами
- Финальным ответом
- Временными метками

### Метрики
- Время обработки запросов
- Количество обработанных документов
- Использование памяти
- Статус зависимостей (Ollama, ChromaDB, PostgreSQL)

## 🔒 Безопасность

### Аутентификация
- JWT токены с HS256 алгоритмом
- Время жизни access токена: 30 минут
- Refresh токены для продления сессии
- Хеширование паролей с bcrypt

### Защита API
- CORS настройки для фронтенда
- Rate limiting (планируется)
- Валидация входных данных через Pydantic
- SQL injection protection через SQLAlchemy

### Безопасность данных
- Шифрование чувствительных данных
- Минимальные необходимые разрешения в БД
- Регулярное резервное копирование
- Очистка старых данных

## 🚀 Производительность

### Оптимизации
- Асинхронные эндпоинты (async/await)
- Connection pooling для PostgreSQL
- Кэширование эмбеддингов
- Пакетная обработка документов
- Потоковая генерация ответов

### Масштабирование
- Горизонтальное масштабирование backend инстансов
- Репликация PostgreSQL
- Кластеризация ChromaDB
- Балансировка нагрузки через Nginx


## 📚 Полезные ссылки

- [FastAPI документация](https://fastapi.tiangolo.com/)
- [LangChain документация](https://python.langchain.com/)
- [LangGraph документация](https://langchain-ai.github.io/langgraph/)
- [Ollama документация](https://ollama.ai/)
- [ChromaDB документация](https://docs.trychroma.com/)
- [SQLAlchemy документация](https://docs.sqlalchemy.org/)

---

**Примечание**: Этот README обновляется по мере развития проекта. Для получения самой актуальной информации обратитесь к документации в коде или свяжитесь с командой разработки.
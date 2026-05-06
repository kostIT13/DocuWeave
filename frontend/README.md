# DocuWeave Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)

Современное React-приложение для взаимодействия с DocuWeave API. Предоставляет интуитивный интерфейс для работы с документами, интеллектуальными агентами и чат-системой.

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ и npm/yarn/pnpm
- Запущенный backend сервер (см. [backend README](../backend/README.md))

### Установка и запуск

```bash
# Клонируйте репозиторий (если еще не сделали)
git clone <repository-url>
cd DocuWeave

# Установите зависимости
cd frontend
npm install

# Настройте переменные окружения
cp .env.example .env.local
# Отредактируйте .env.local при необходимости

# Запустите сервер разработки
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Запуск с Docker Compose
```bash
# Из корневой директории проекта
docker-compose up -d frontend
```

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── components/           # Переиспользуемые UI компоненты
│   │   └── ui/              # Базовые компоненты (Button, Card, Input и т.д.)
│   ├── pages/               # Страницы приложения
│   │   ├── Dashboard.tsx    # Главная страница
│   │   ├── Documents.tsx    # Управление документами
│   │   ├── Agent.tsx        # Взаимодействие с агентом
│   │   ├── Chat.tsx         # Чат-интерфейс
│   │   ├── Settings.tsx     # Настройки
│   │   └── Login.tsx        # Страница входа
│   ├── layouts/             # Макеты страниц
│   │   └── MainLayout.tsx   # Основной макет с навигацией
│   ├── hooks/               # Кастомные React хуки
│   │   └── useAuth.ts       # Хук для работы с аутентификацией
│   ├── services/            # Сервисы для работы с API
│   │   └── api.ts           # Клиент API с настройкой axios
│   ├── types/               # TypeScript типы и интерфейсы
│   │   └── index.ts         # Экспорт всех типов
│   ├── lib/                 # Вспомогательные утилиты
│   │   └── utils.ts         # Общие утилиты
│   ├── assets/              # Статические ресурсы
│   │   ├── hero.png         # Изображения
│   │   ├── react.svg        # Иконки
│   │   └── vite.svg         # Иконки
│   ├── App.tsx              # Корневой компонент приложения
│   ├── App.css              # Глобальные стили
│   ├── index.css            # Основные стили Tailwind
│   └── main.tsx             # Точка входа
├── public/                  # Публичные статические файлы
│   ├── favicon.svg          # Фавикон
│   └── icons.svg            # SVG иконки
├── package.json             # Зависимости и скрипты
├── vite.config.ts           # Конфигурация Vite
├── tailwind.config.js       # Конфигурация Tailwind CSS
├── tsconfig.json            # Конфигурация TypeScript
└── Dockerfile               # Docker образ
```

## 🛠️ Технологический стек

### Основные технологии
- **React 19** - Библиотека для построения пользовательских интерфейсов
- **TypeScript** - Статическая типизация для JavaScript
- **Vite** - Современный сборщик и сервер разработки
- **Tailwind CSS** - Utility-first CSS фреймворк
- **React Router DOM v7** - Маршрутизация в приложении
- **React Query (TanStack Query)** - Управление состоянием серверных данных
- **Zustand** - Управление клиентским состоянием
- **Axios** - HTTP клиент для работы с API

### UI библиотеки и компоненты
- **Headless UI** - Доступные, нестилизованные UI компоненты
- **Radix UI** - Примитивы для построения доступных компонентов
- **Lucide React** - Набор иконок
- **Framer Motion** - Анимации
- **React Hot Toast** - Уведомления

### Зависимости
Основные зависимости перечислены в `package.json`:

```json
{
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "@tanstack/react-query": "^5.100.9",
    "axios": "^1.16.0",
    "react-router-dom": "^7.14.2",
    "zustand": "^5.0.12",
    "tailwindcss": "^3.4.19",
    "lucide-react": "^1.14.0",
    "framer-motion": "^12.38.0"
  }
}
```

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env.local` на основе `.env.example`:

```bash
# Базовый URL API бэкенда
VITE_API_URL=http://localhost:8000

# Настройки приложения
VITE_APP_NAME=DocuWeave
VITE_APP_VERSION=1.0.0

# Настройки WebSocket (если используется)
VITE_WS_URL=ws://localhost:8000/ws
```

### Конфигурация Vite
Основные настройки в `vite.config.ts`:
- Поддержка React
- Алиасы для путей (`@/*` → `src/*`)
- Проксирование запросов к API в режиме разработки
- Оптимизация сборки

### Конфигурация Tailwind CSS
Настройки в `tailwind.config.js`:
- Кастомные цвета и темы
- Расширенные утилиты
- Плагины для typography, forms, aspect-ratio

## 🎨 UI/UX Особенности

### Дизайн система
- **Цветовая палитра**: Современная палитра с акцентом на синий (#3B82F6)
- **Типографика**: Inter шрифт с четкой иерархией
- **Spacing**: 4px базовая единица (scale: 0.25rem)
- **Тени**: Многоуровневая система теней для глубины

### Компоненты
#### Базовые компоненты (`src/components/ui/`)
- **Button** - Кнопки с вариантами (primary, secondary, ghost)
- **Card** - Карточки для контента
- **Input** - Поля ввода с валидацией
- **Skeleton** - Placeholder для загрузки

#### Сложные компоненты
- **DocumentUploader** - Загрузка документов с drag & drop
- **ChatInterface** - Интерфейс чата с потоковыми ответами
- **AgentConsole** - Консоль для взаимодействия с агентом
- **DocumentList** - Список документов с фильтрацией

### Адаптивность
- Mobile-first подход
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Гибкие сетки с CSS Grid и Flexbox

## 📡 Работа с API

### Клиент API
Основной клиент настроен в `src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления JWT токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### React Query
Используется для управления серверным состоянием:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Пример запроса документов
const useDocuments = (projectId: string) => {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => api.get(`/documents?project_id=${projectId}`),
  });
};

// Пример мутации загрузки документа
const useUploadDocument = () => {
  return useMutation({
    mutationFn: (formData: FormData) => 
      api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  });
};
```

### Типизация API
Все типы определены в `src/types/index.ts`:

```typescript
export interface Document {
  id: string;
  filename: string;
  file_type: 'pdf' | 'docx' | 'txt';
  file_size: number;
  uploaded_at: string;
  project_id: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface AgentResponse {
  answer: string;
  sources: DocumentSource[];
  tools_used: string[];
  processing_time: number;
}
```

## 🔐 Аутентификация

### Flow аутентификации
1. Пользователь вводит credentials на странице `/login`
2. При успешной аутентификации получает JWT токен
3. Токен сохраняется в localStorage
4. Все последующие запросы включают токен в заголовке Authorization
5. При истечении токена - автоматический refresh или редирект на логин

### Хук useAuth
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email, password) => {
    // Реализация логина
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null });
  },
}));
```

### Защищенные маршруты
Используется компонент `ProtectedRoute` для защиты страниц:

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## 📊 Страницы приложения

### Dashboard (`/`)
Главная страница с:
- Статистикой по документам
- Быстрыми действиями
- Недавними чатами
- Состоянием системы

### Documents (`/documents`)
Управление документами:
- Загрузка документов (drag & drop)
- Просмотр списка документов
- Фильтрация по типу и дате
- Удаление документов
- Предпросмотр метаданных

### Agent (`/agent`)
Взаимодействие с интеллектуальным агентом:
- Интерфейс для отправки запросов
- Отображение цепочки reasoning агента
- Просмотр использованных инструментов
- История диалогов

### Chat (`/chat`)
Чат-интерфейс:
- Создание новых чат-сессий
- Потоковые ответы от агента
- Прикрепление документов к чату
- Экспорт истории чата

### Settings (`/settings`)
Настройки пользователя и проекта:
- Профиль пользователя
- Настройки уведомлений
- Конфигурация агента
- Интеграции

## 🔄 Состояние приложения

### Глобальное состояние (Zustand)
```typescript
// store/ui.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

### Локальное состояние
- Формы: React Hook Form с валидацией Zod
- Модальные окна: Управление через состояние компонента
- Фильтры: URL параметры или локальное состояние

## 🎯 Производительность

### Оптимизации
- **Code splitting**: Динамический импорт для больших компонентов
- **Lazy loading**: Загрузка страниц по требованию
- **Image optimization**: Использование Vite для оптимизации изображений
- **Bundle analysis**: Анализ размера бандла

### Кэширование
- React Query кэширование запросов
- LocalStorage для пользовательских настроек
- SessionStorage для временных данных

### Мониторинг
- Ошибки: Sentry или аналоги
- Производительность: React DevTools, Lighthouse
- Аналитика: Google Analytics или аналоги

## 🧪 Тестирование

### Unit тесты
```bash
# Запуск тестов
npm test

# Запуск с покрытием
npm test -- --coverage
```

### Компонентные тесты
Используется Vitest + Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## 🐳 Docker

### Сборка образа
```bash
docker build -t docuweave-frontend:latest ./frontend
```

### Запуск в Docker Compose
```bash
# Из корневой директории проекта
docker-compose up -d frontend
```

### Многоступенчатая сборка
Dockerfile использует многоступенчатую сборку:
1. Этап зависимостей
2. Этап сборки
3. Этап продакшена с nginx


## 🔧 Разработка

### Скрипты package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "format": "prettier --write .",
    "test": "vitest"
  }
}
```

### Линтинг и форматирование
- **ESLint**: Проверка кода
- **Prettier**: Форматирование кода
- **Husky**: Git hooks для pre-commit проверок

### Рабочий процесс
1. Создайте feature branch
2. Реализуйте изменения
3. Напишите тесты
4. Запустите линтеры
5. Создайте pull request

## 🚀 Деплой

### Статический хостинг
```bash
# Сборка проекта
npm run build

# Деплой на Vercel/Netlify
vercel --prod
```

### Docker образ
```bash
# Сборка и публикация
docker build -t yourusername/docuweave-frontend:latest .
docker push yourusername/docuweave-frontend:latest
```

### Environment variables
Убедитесь, что все переменные окружения установлены на хостинге:
- `VITE_API_URL` - URL бэкенд API
- `VITE_APP_NAME` - Название приложения
- Другие переменные из `.env.example`


### Коммиты
Используйте Conventional Commits:
- `feat:` Новая функциональность
- `fix:` Исправление бага
- `docs:` Изменения в документации
- `style:` Форматирование кода
- `refactor:` Рефакторинг кода
- `test:` Добавление тестов


## 📚 Полезные ссылки

- [React документация](https://react.dev/)
- [TypeScript документация](https://www.typescriptlang.org/docs/)
- [Tailwind CSS документация](https://tailwindcss.com/docs)
- [Vite документация](https://vitejs.dev/guide/)
- [React Query документация](https://tanstack.com/query/latest)
- [Zustand документация](https://docs.pmnd.rs/zustand/getting-started/introduction)



**Примечание**: Этот README обновляется по мере развития проекта. Для получения самой актуальной информации обратитесь к документации в коде или свяжитесь с командой разработки.
# JustPastLink - Frontend

Frontend приложение для дипломного проекта "JustPastLink".

## 🚀 Деплой

Frontend развернут и доступен по адресу: **https://3m55eynp6kpg6.ok.kimi.link**

## 📋 Функционал

### Аутентификация
- Регистрация новых пользователей
- Вход в систему
- JWT-based аутентификация
- Защищенные маршруты

### Работа с видео
- Загрузка видео файлов (drag & drop + выбор файла)
- Отображение списка видео пользователя
- Удаление видео
- Просмотр детальной информации о видео

### Обработка контента
- Отслеживание статуса обработки в реальном времени
- Просмотр транскрипта с возможностью копирования и скачивания
- Просмотр и редактирование лекции (контент + summary)
- Интерактивный quiz с проверкой ответов

## 🛠 Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **Tailwind CSS** - стилизация
- **shadcn/ui** - компоненты интерфейса
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Lucide React** - иконки

## 📁 Структура проекта

```
src/
├── components/
│   ├── auth/           # Компоненты аутентификации
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── content/        # Компоненты контента
│   │   ├── TranscriptView.tsx
│   │   ├── LectureView.tsx
│   │   └── QuizView.tsx
│   ├── layout/         # Layout компоненты
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   └── video/          # Компоненты видео
│       ├── VideoUpload.tsx
│       ├── VideoList.tsx
│       └── ProcessingStatus.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Аутентификация
│   ├── useVideos.ts    # Работа с видео
│   ├── useTranscript.ts
│   ├── useLecture.ts
│   └── useQuiz.ts
├── lib/                # Утилиты и API
│   ├── api.ts          # API клиент
│   └── utils.ts        # Вспомогательные функции
├── pages/              # Страницы приложения
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   └── VideoDetailPage.tsx
├── types/              # TypeScript типы
│   └── index.ts
└── App.tsx             # Корневой компонент
```

## ⚙️ Настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Конфигурация окружения
Создайте файл `.env` (опционально):

```env
# В режиме разработки Vite проксирует запросы к FastAPI.
# В production фронтенд будет обслуживаться самим FastAPI (из app/dist).
VITE_API_URL=http://localhost:8000
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### 4. Сборка для production

```bash
npm run build
```

Сборка будет создана в папке `dist/`.

### Запуск FastAPI + UI (production)
После сборки запустите backend — он будет раздавать `dist/`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Приложение будет доступно по адресу: http://localhost:8000

## 🔌 Интеграция с Backend

Frontend ожидает следующие эндпоинты от FastAPI backend:

### Auth
- `POST /auth/login` - вход
- `POST /auth/register` - регистрация
- `GET /auth/me` - текущий пользователь

### Videos
- `GET /videos` - список видео
- `POST /videos/upload` - загрузка видео
- `GET /videos/{id}` - информация о видео
- `DELETE /videos/{id}` - удаление видео

### Processing
- `GET /processing/{video_id}/status` - статус обработки
- `POST /processing/{video_id}/transcribe` - запуск транскрипции
- `POST /processing/{video_id}/generate-lecture` - генерация лекции
- `POST /processing/{video_id}/generate-quiz` - генерация quiz

### Transcripts
- `GET /transcripts/{video_id}` - получить транскрипт

### Lectures
- `GET /lectures/{video_id}` - получить лекцию
- `PUT /lectures/{video_id}` - обновить лекцию

### Quiz
- `GET /quiz/video/{video_id}/questions` - получить вопросы

## 🎨 UI Компоненты

Используются компоненты из shadcn/ui:
- Button, Card, Input, Label
- Tabs, Dialog, Dropdown Menu
- Alert, Badge, Skeleton
- Progress, Scroll Area
- Radio Group, Avatar
- Sheet, Toast (Sonner)

## 📱 Адаптивность

Приложение адаптировано для:
- Десктоп (1024px+)
- Планшет (768px - 1023px)
- Мобильные устройства (< 768px)

## 🔒 Безопасность

- JWT токены хранятся в localStorage
- Защищенные маршруты с проверкой аутентификации
- Автоматический редирект на login при 401 ошибке
- Валидация форм на клиенте

## 📝 Дополнительные возможности

### VideoUpload
- Drag & drop загрузка
- Валидация типа файла (video/*)
- Валидация размера (max 500MB)
- Прогресс загрузки

### ProcessingStatus
- Автоматический polling статуса
- Визуализация job'ов
- Быстрые действия (start transcription/lecture/quiz)
- Индикаторы готовности контента

### QuizView
- Два режима: preview и quiz mode
- Проверка ответов с объяснениями
- Подсчет результатов
- Навигация между вопросами

### LectureView
- Просмотр контента и summary
- Редактирование через модальное окно
- Табы для переключения между контентом и summary

-- Добавление ограничения на тип урока (безопасное добавление)
-- Сначала проверим, есть ли уроки с неподдерживаемыми типами
DO $$
BEGIN
  -- Проверяем существующие типы уроков
  IF EXISTS (SELECT 1 FROM public.lessons WHERE type IS NOT NULL AND type NOT IN ('video', 'pdf', 'quiz', 'test')) THEN
    RAISE NOTICE 'Found lessons with unsupported types. Updating them to "video"...';
    -- Обновляем неподдерживаемые типы на "video" по умолчанию
    UPDATE public.lessons SET type = 'video' WHERE type IS NOT NULL AND type NOT IN ('video', 'pdf', 'quiz', 'test');
  END IF;
  
  -- Добавляем constraint только если его еще нет
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_type_check') THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_type_check
      CHECK (type IN ('video', 'pdf', 'quiz', 'test') OR type IS NULL);
    RAISE NOTICE 'Added lesson type constraint';
  END IF;
END $$;

-- Создание индекса для быстрого поиска по типу (если не существует)
CREATE INDEX IF NOT EXISTS idx_lessons_type ON public.lessons(type); 
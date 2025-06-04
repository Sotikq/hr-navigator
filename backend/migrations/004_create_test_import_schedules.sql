-- Создание таблицы для хранения расписаний автоматического импорта результатов тестов
CREATE TABLE IF NOT EXISTS public.test_import_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  part integer NOT NULL CHECK (part > 0),
  sheet_id text NOT NULL,
  schedule_cron text NOT NULL,
  is_active boolean DEFAULT true,
  last_import_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(course_id, part)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_test_import_schedules_course_id ON public.test_import_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_test_import_schedules_active ON public.test_import_schedules(is_active) WHERE is_active = true;

-- Включение RLS для таблицы (только админы могут управлять расписаниями)
ALTER TABLE public.test_import_schedules ENABLE ROW LEVEL SECURITY;

-- Политика: только админы могут просматривать и управлять расписаниями
CREATE POLICY "Only admins can manage import schedules"
ON public.test_import_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE public.test_import_schedules IS 'Расписания автоматического импорта результатов тестов из Google Sheets';
COMMENT ON COLUMN public.test_import_schedules.course_id IS 'ID курса';
COMMENT ON COLUMN public.test_import_schedules.part IS 'Номер части теста (любое положительное число)';
COMMENT ON COLUMN public.test_import_schedules.sheet_id IS 'ID Google Sheets для импорта';
COMMENT ON COLUMN public.test_import_schedules.schedule_cron IS 'Cron выражение для расписания (например, "0 */2 * * *" - каждые 2 часа)';
COMMENT ON COLUMN public.test_import_schedules.is_active IS 'Активно ли расписание';
COMMENT ON COLUMN public.test_import_schedules.last_import_at IS 'Время последнего успешного импорта'; 
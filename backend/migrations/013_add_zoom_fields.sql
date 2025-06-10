-- Миграция 013: Добавление полей для Zoom ссылок

-- Добавляем поле zoom_url в таблицу курсов
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS zoom_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS zoom_meeting_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS zoom_passcode VARCHAR(50);

-- Добавляем поля zoom_url в таблицу уроков (для индивидуальных ссылок)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS zoom_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS zoom_meeting_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS zoom_passcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS zoom_scheduled_time TIMESTAMP;

-- Комментарии для документации
COMMENT ON COLUMN courses.zoom_url IS 'URL для Zoom конференции курса';
COMMENT ON COLUMN courses.zoom_meeting_id IS 'ID Zoom встречи';
COMMENT ON COLUMN courses.zoom_passcode IS 'Пароль для входа в Zoom';

COMMENT ON COLUMN lessons.zoom_url IS 'URL для Zoom конференции урока';
COMMENT ON COLUMN lessons.zoom_meeting_id IS 'ID Zoom встречи урока';
COMMENT ON COLUMN lessons.zoom_passcode IS 'Пароль для входа в Zoom урока';
COMMENT ON COLUMN lessons.zoom_scheduled_time IS 'Запланированное время Zoom встречи'; 
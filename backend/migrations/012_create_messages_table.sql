-- Миграция 012: Создание таблицы для личных сообщений

-- Таблица личных сообщений
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url VARCHAR(500),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности чата
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted) WHERE is_deleted = FALSE;

-- Композитный индекс для истории чата между двумя пользователями
CREATE INDEX IF NOT EXISTS idx_messages_chat_history ON messages(
  LEAST(sender_id, receiver_id), 
  GREATEST(sender_id, receiver_id), 
  created_at DESC
) WHERE is_deleted = FALSE;

-- Индекс для поиска по содержимому
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('russian', content));

-- Триггер для обновления updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
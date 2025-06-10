const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Отправка личного сообщения
 */
async function sendMessage({
  senderId,
  receiverId,
  content,
  attachmentUrl = null,
  messageType = 'text' // text, file, image
}) {
  const query = `
    INSERT INTO messages (sender_id, receiver_id, content, attachment_url, message_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [senderId, receiverId, content, attachmentUrl, messageType];
  const { rows } = await pool.query(query, values);
  
  logger.info('Message sent', { 
    messageId: rows[0].id, 
    senderId, 
    receiverId, 
    messageType 
  });
  
  return rows[0];
}

/**
 * Получение истории сообщений между двумя пользователями
 */
async function getMessageHistory(userId1, userId2, limit = 50, offset = 0) {
  const query = `
    SELECT m.*, 
           s.name as sender_name,
           s.role as sender_role,
           r.name as receiver_name,
           r.role as receiver_role
    FROM messages m
    LEFT JOIN users s ON m.sender_id = s.id
    LEFT JOIN users r ON m.receiver_id = r.id
    WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
       OR (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  
  const { rows } = await pool.query(query, [userId1, userId2, limit, offset]);
  return rows.reverse(); // Возвращаем в хронологическом порядке
}

/**
 * Получение списка всех чатов пользователя
 */
async function getUserChats(userId) {
  const query = `
    WITH latest_messages AS (
      SELECT DISTINCT ON (
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END
      ) 
        m.*,
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as other_user_id
      FROM messages m
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY 
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END,
        created_at DESC
    )
    SELECT lm.*, 
           u.name as other_user_name,
           u.role as other_user_role,
           u.email as other_user_email,
           (
             SELECT COUNT(*) 
             FROM messages 
             WHERE sender_id = lm.other_user_id 
               AND receiver_id = $1 
               AND is_read = false
           ) as unread_count
    FROM latest_messages lm
    LEFT JOIN users u ON lm.other_user_id = u.id
    ORDER BY lm.created_at DESC
  `;
  
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

/**
 * Пометить сообщения как прочитанные
 */
async function markMessagesAsRead(senderId, receiverId) {
  const query = `
    UPDATE messages 
    SET is_read = true, read_at = NOW()
    WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
    RETURNING id
  `;
  
  const { rows } = await pool.query(query, [senderId, receiverId]);
  
  if (rows.length > 0) {
    logger.info('Messages marked as read', { 
      senderId, 
      receiverId, 
      count: rows.length 
    });
  }
  
  return rows.length;
}

/**
 * Получение количества непрочитанных сообщений
 */
async function getUnreadMessageCount(userId) {
  const query = `
    SELECT COUNT(*) as unread_count
    FROM messages 
    WHERE receiver_id = $1 AND is_read = false
  `;
  
  const { rows } = await pool.query(query, [userId]);
  return parseInt(rows[0].unread_count);
}

/**
 * Поиск сообщений по содержимому
 */
async function searchMessages(userId, searchTerm, limit = 20) {
  const query = `
    SELECT m.*, 
           s.name as sender_name,
           r.name as receiver_name
    FROM messages m
    LEFT JOIN users s ON m.sender_id = s.id
    LEFT JOIN users r ON m.receiver_id = r.id
    WHERE (m.sender_id = $1 OR m.receiver_id = $1)
      AND m.content ILIKE $2
    ORDER BY m.created_at DESC
    LIMIT $3
  `;
  
  const { rows } = await pool.query(query, [userId, `%${searchTerm}%`, limit]);
  return rows;
}

/**
 * Удаление сообщения
 */
async function deleteMessage(messageId, userId) {
  // Проверяем, что пользователь может удалить это сообщение (отправитель)
  const query = `
    UPDATE messages 
    SET is_deleted = true, deleted_at = NOW()
    WHERE id = $1 AND sender_id = $2
    RETURNING id
  `;
  
  const { rows } = await pool.query(query, [messageId, userId]);
  
  if (rows.length > 0) {
    logger.info('Message deleted', { messageId, userId });
  }
  
  return rows[0];
}

/**
 * Получение сообщения по ID
 */
async function getMessageById(messageId) {
  const query = `
    SELECT m.*, 
           s.name as sender_name,
           s.role as sender_role,
           r.name as receiver_name,
           r.role as receiver_role
    FROM messages m
    LEFT JOIN users s ON m.sender_id = s.id
    LEFT JOIN users r ON m.receiver_id = r.id
    WHERE m.id = $1 AND m.is_deleted = false
  `;
  
  const { rows } = await pool.query(query, [messageId]);
  return rows[0];
}

/**
 * Получение статистики сообщений для админа
 */
async function getMessageStats() {
  const query = `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages,
      COUNT(DISTINCT sender_id) as active_senders,
      COUNT(DISTINCT receiver_id) as active_receivers,
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as daily_count
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date DESC
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  sendMessage,
  getMessageHistory,
  getUserChats,
  markMessagesAsRead,
  getUnreadMessageCount,
  searchMessages,
  deleteMessage,
  getMessageById,
  getMessageStats
}; 
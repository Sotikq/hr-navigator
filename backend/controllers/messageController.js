const messageModel = require('../models/Message');
const { findUserById } = require('../models/User');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Отправка личного сообщения
 */
async function sendMessage(req, res, next) {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      throw new ApiError(400, 'Receiver ID and content are required');
    }

    if (senderId === receiverId) {
      throw new ApiError(400, 'Cannot send message to yourself');
    }

    // Проверяем существование получателя
    const receiver = await findUserById(receiverId);
    if (!receiver) {
      throw new ApiError(404, 'Receiver not found');
    }

    // Проверяем что можно отправить сообщение (студент может писать только учителям, учитель - всем)
    if (req.user.role === 'user' && receiver.role !== 'teacher' && receiver.role !== 'admin') {
      throw new ApiError(403, 'Students can only send messages to teachers');
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/chat/${req.file.filename}`;
    }

    const message = await messageModel.sendMessage({
      senderId,
      receiverId,
      content,
      attachmentUrl,
      messageType
    });

    // Добавляем информацию об отправителе в ответ
    const messageWithSender = {
      ...message,
      sender_name: req.user.name,
      sender_role: req.user.role,
      receiver_name: receiver.name,
      receiver_role: receiver.role
    };

    res.status(201).json({
      success: true,
      data: messageWithSender,
      message: 'Message sent successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение истории сообщений между двумя пользователями
 */
async function getMessageHistory(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    // Проверяем права доступа - пользователь может смотреть только свои чаты
    if (req.user.role === 'user' && userId !== currentUserId) {
      // Проверяем что этот чат с учителем
      const otherUser = await findUserById(userId);
      if (!otherUser || (otherUser.role !== 'teacher' && otherUser.role !== 'admin')) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const messages = await messageModel.getMessageHistory(
      currentUserId, 
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );

    // Помечаем сообщения как прочитанные
    await messageModel.markMessagesAsRead(userId, currentUserId);

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение списка всех чатов пользователя
 */
async function getUserChats(req, res, next) {
  try {
    const userId = req.user.id;

    const chats = await messageModel.getUserChats(userId);

    res.json({
      success: true,
      data: chats,
      count: chats.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Пометить сообщения как прочитанные
 */
async function markAsRead(req, res, next) {
  try {
    const { senderId } = req.params;
    const receiverId = req.user.id;

    const markedCount = await messageModel.markMessagesAsRead(senderId, receiverId);

    res.json({
      success: true,
      message: `${markedCount} messages marked as read`
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение количества непрочитанных сообщений
 */
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;

    const unreadCount = await messageModel.getUnreadMessageCount(userId);

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Поиск сообщений
 */
async function searchMessages(req, res, next) {
  try {
    const { q: searchTerm, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!searchTerm) {
      throw new ApiError(400, 'Search term is required');
    }

    const messages = await messageModel.searchMessages(userId, searchTerm, parseInt(limit));

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Удаление сообщения
 */
async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const deletedMessage = await messageModel.deleteMessage(messageId, userId);

    if (!deletedMessage) {
      throw new ApiError(404, 'Message not found or you can only delete your own messages');
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение сообщения по ID
 */
async function getMessageById(req, res, next) {
  try {
    const { messageId } = req.params;

    const message = await messageModel.getMessageById(messageId);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    // Проверяем права доступа
    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
      throw new ApiError(403, 'Access denied');
    }

    res.json({
      success: true,
      data: message
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Статистика сообщений (для админа)
 */
async function getMessageStats(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const stats = await messageModel.getMessageStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получить список пользователей для начала чата (учителя для студента)
 */
async function getChatContacts(req, res, next) {
  try {
    const pool = require('../config/db');
    let query;
    
    if (req.user.role === 'user') {
      // Студенты видят только учителей
      query = `
        SELECT id, name, email, 'teacher' as role 
        FROM users 
        WHERE role = 'teacher' 
        ORDER BY name ASC
      `;
    } else if (req.user.role === 'teacher') {
      // Учителя видят всех студентов и других учителей
      query = `
        SELECT id, name, email, role 
        FROM users 
        WHERE role IN ('user', 'teacher') AND id != $1
        ORDER BY role, name ASC
      `;
    } else {
      // Админ видит всех
      query = `
        SELECT id, name, email, role 
        FROM users 
        WHERE id != $1
        ORDER BY role, name ASC
      `;
    }

    const { rows } = await pool.query(query, req.user.role === 'user' ? [] : [req.user.id]);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendMessage,
  getMessageHistory,
  getUserChats,
  markAsRead,
  getUnreadCount,
  searchMessages,
  deleteMessage,
  getMessageById,
  getMessageStats,
  getChatContacts
}; 
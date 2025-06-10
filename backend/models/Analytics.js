const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Общая аналитика дашборда
 */
async function getDashboardStats() {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE role = 'user') as total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
      (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
      (SELECT COUNT(*) FROM payments WHERE status = 'approved') as total_payments,
      (SELECT SUM(amount) FROM payments WHERE status = 'approved') as total_revenue,
      (SELECT COUNT(*) FROM certificates) as total_certificates,
      (SELECT COUNT(*) FROM assignment_submissions) as total_assignments_submitted,
      (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_today,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
      (SELECT COUNT(*) FROM payments WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '30 days') as payments_month
  `;
  
  const { rows } = await pool.query(query);
  return rows[0];
}

/**
 * Статистика продаж по периодам
 */
async function getSalesAnalytics(period = '30 days') {
  const query = `
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as transaction_count,
      SUM(amount) as daily_revenue,
      COUNT(DISTINCT user_id) as unique_customers
    FROM payments 
    WHERE status = 'approved' 
      AND created_at >= NOW() - INTERVAL '${period}'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date DESC
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Топ курсов по продажам
 */
async function getTopCoursesBySales(limit = 10) {
  const query = `
    SELECT 
      c.id,
      c.title,
      c.price,
      COUNT(p.id) as sales_count,
      SUM(p.amount) as total_revenue,
      AVG(r.rating) as average_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM courses c
    LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'approved'
    LEFT JOIN reviews r ON c.id = r.course_id
    WHERE c.is_published = true
    GROUP BY c.id, c.title, c.price
    ORDER BY sales_count DESC, total_revenue DESC
    LIMIT $1
  `;
  
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

/**
 * Активность студентов
 */
async function getStudentActivityStats() {
  const query = `
    WITH student_stats AS (
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at as registration_date,
        COUNT(DISTINCT p.id) as courses_purchased,
        COUNT(DISTINCT lp.id) as lessons_completed,
        COUNT(DISTINCT as_sub.id) as assignments_submitted,
        COUNT(DISTINCT c.id) as certificates_earned,
        MAX(lp.completed_at) as last_activity
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'approved'
      LEFT JOIN lesson_progress lp ON u.id = lp.user_id
      LEFT JOIN assignment_submissions as_sub ON u.id = as_sub.student_id
      LEFT JOIN certificates c ON u.id = c.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.created_at
    )
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN courses_purchased > 0 THEN 1 END) as active_students,
      COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '7 days' THEN 1 END) as students_active_week,
      COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '30 days' THEN 1 END) as students_active_month,
      ROUND(AVG(courses_purchased), 2) as avg_courses_per_student,
      ROUND(AVG(lessons_completed), 2) as avg_lessons_per_student
    FROM student_stats
  `;
  
  const { rows } = await pool.query(query);
  return rows[0];
}

/**
 * Детальная активность по курсам
 */
async function getCourseEngagementStats() {
  const query = `
    SELECT 
      c.id,
      c.title,
      c.created_at,
      COUNT(DISTINCT p.user_id) as enrolled_students,
      COUNT(DISTINCT lp.user_id) as active_students,
      COUNT(DISTINCT cert.user_id) as completed_students,
      CASE 
        WHEN COUNT(DISTINCT p.user_id) > 0 
        THEN ROUND((COUNT(DISTINCT cert.user_id)::float / COUNT(DISTINCT p.user_id)) * 100, 2)
        ELSE 0 
      END as completion_rate,
      COUNT(DISTINCT a.id) as total_assignments,
      COUNT(DISTINCT as_sub.id) as total_submissions,
      ROUND(AVG(r.rating), 2) as average_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM courses c
    LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'approved'
    LEFT JOIN lesson_progress lp ON c.id = lp.course_id
    LEFT JOIN certificates cert ON c.id = cert.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    LEFT JOIN assignment_submissions as_sub ON a.id = as_sub.assignment_id
    LEFT JOIN reviews r ON c.id = r.course_id
    WHERE c.is_published = true
    GROUP BY c.id, c.title, c.created_at
    ORDER BY enrolled_students DESC
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Финансовая аналитика
 */
async function getFinancialAnalytics(startDate, endDate) {
  const query = `
    WITH payment_stats AS (
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as transaction_count,
        SUM(amount) as revenue,
        COUNT(DISTINCT user_id) as unique_customers,
        COUNT(DISTINCT course_id) as courses_sold
      FROM payments
      WHERE status = 'approved'
        AND created_at BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', created_at)
    )
    SELECT 
      month,
      transaction_count,
      revenue,
      unique_customers,
      courses_sold,
      ROUND(revenue / NULLIF(transaction_count, 0), 2) as avg_transaction_value,
      LAG(revenue) OVER (ORDER BY month) as prev_month_revenue,
      CASE 
        WHEN LAG(revenue) OVER (ORDER BY month) IS NOT NULL AND LAG(revenue) OVER (ORDER BY month) > 0
        THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month)) * 100, 2)
        ELSE NULL
      END as growth_rate
    FROM payment_stats
    ORDER BY month DESC
  `;
  
  const { rows } = await pool.query(query, [startDate, endDate]);
  return rows;
}

/**
 * Статистика преподавателей
 */
async function getTeacherStats() {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(DISTINCT c.id) as courses_created,
      COUNT(DISTINCT p.id) as total_sales,
      SUM(p.amount) as total_earnings,
      COUNT(DISTINCT p.user_id) as unique_students,
      ROUND(AVG(r.rating), 2) as average_rating,
      COUNT(DISTINCT r.id) as total_reviews,
      COUNT(DISTINCT a.id) as assignments_created,
      COUNT(DISTINCT as_sub.id) as assignments_graded
    FROM users u
    LEFT JOIN courses c ON u.id = c.author_id
    LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'approved'
    LEFT JOIN reviews r ON c.id = r.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    LEFT JOIN assignment_submissions as_sub ON a.id = as_sub.assignment_id AND as_sub.status = 'graded'
    WHERE u.role = 'teacher'
    GROUP BY u.id, u.name, u.email
    ORDER BY total_earnings DESC NULLS LAST
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Конверсионная воронка
 */
async function getConversionFunnel(period = '30 days') {
  const query = `
    SELECT 
      'Регистрации' as stage,
      COUNT(*) as count,
      100.0 as percentage
    FROM users 
    WHERE role = 'user' 
      AND created_at >= NOW() - INTERVAL '${period}'
    
    UNION ALL
    
    SELECT 
      'Просмотры курсов' as stage,
      COUNT(DISTINCT user_id) as count,
      ROUND((COUNT(DISTINCT user_id)::float / (
        SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= NOW() - INTERVAL '${period}'
      )) * 100, 2) as percentage
    FROM lesson_progress lp
    WHERE lp.created_at >= NOW() - INTERVAL '${period}'
    
    UNION ALL
    
    SELECT 
      'Покупки' as stage,
      COUNT(DISTINCT user_id) as count,
      ROUND((COUNT(DISTINCT user_id)::float / (
        SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= NOW() - INTERVAL '${period}'
      )) * 100, 2) as percentage
    FROM payments 
    WHERE status = 'approved' 
      AND created_at >= NOW() - INTERVAL '${period}'
    
    UNION ALL
    
    SELECT 
      'Завершения курсов' as stage,
      COUNT(DISTINCT user_id) as count,
      ROUND((COUNT(DISTINCT user_id)::float / (
        SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= NOW() - INTERVAL '${period}'
      )) * 100, 2) as percentage
    FROM certificates 
    WHERE created_at >= NOW() - INTERVAL '${period}'
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Системная аналитика (производительность, ошибки)
 */
async function getSystemStats() {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_today,
      (SELECT COUNT(*) FROM assignment_submissions WHERE created_at >= NOW() - INTERVAL '24 hours') as submissions_today,
      (SELECT COUNT(*) FROM lesson_progress WHERE created_at >= NOW() - INTERVAL '24 hours') as lessons_completed_today,
      (SELECT COUNT(*) FROM certificates WHERE created_at >= NOW() - INTERVAL '24 hours') as certificates_issued_today,
      (SELECT COUNT(*) FROM payments WHERE created_at >= NOW() - INTERVAL '24 hours') as payments_today
  `;
  
  const { rows } = await pool.query(query);
  return rows[0];
}

/**
 * Экспорт данных для отчетов
 */
async function exportAnalyticsData(type, startDate, endDate) {
  let query;
  
  switch (type) {
    case 'sales':
      query = `
        SELECT 
          p.created_at as payment_date,
          u.name as student_name,
          u.email as student_email,
          c.title as course_title,
          p.amount,
          p.status
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN courses c ON p.course_id = c.id
        WHERE p.created_at BETWEEN $1 AND $2
        ORDER BY p.created_at DESC
      `;
      break;
      
    case 'students':
      query = `
        SELECT 
          u.name,
          u.email,
          u.created_at as registration_date,
          COUNT(DISTINCT p.id) as courses_purchased,
          COUNT(DISTINCT lp.id) as lessons_completed,
          COUNT(DISTINCT c.id) as certificates_earned
        FROM users u
        LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'approved'
        LEFT JOIN lesson_progress lp ON u.id = lp.user_id
        LEFT JOIN certificates c ON u.id = c.user_id
        WHERE u.role = 'user' AND u.created_at BETWEEN $1 AND $2
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY u.created_at DESC
      `;
      break;
      
    default:
      throw new Error('Invalid export type');
  }
  
  const { rows } = await pool.query(query, [startDate, endDate]);
  return rows;
}

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getTopCoursesBySales,
  getStudentActivityStats,
  getCourseEngagementStats,
  getFinancialAnalytics,
  getTeacherStats,
  getConversionFunnel,
  getSystemStats,
  exportAnalyticsData
}; 
const analyticsModel = require('../models/Analytics');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Главный дашборд с общей статистикой
 */
async function getDashboard(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const stats = await analyticsModel.getDashboardStats();

    // Вычисляем дополнительные метрики
    const metrics = {
      ...stats,
      conversion_rate: stats.total_students > 0 ? 
        ((stats.total_payments / stats.total_students) * 100).toFixed(2) : 0,
      avg_revenue_per_student: stats.total_students > 0 ? 
        (stats.total_revenue / stats.total_students).toFixed(2) : 0,
      certificate_completion_rate: stats.total_payments > 0 ?
        ((stats.total_certificates / stats.total_payments) * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Статистика продаж
 */
async function getSalesAnalytics(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { period = '30 days' } = req.query;
    
    const salesData = await analyticsModel.getSalesAnalytics(period);

    // Подсчитываем общие метрики
    const totalRevenue = salesData.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0);
    const totalTransactions = salesData.reduce((sum, day) => sum + parseInt(day.transaction_count || 0), 0);
    const avgTransactionValue = totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        daily_stats: salesData,
        summary: {
          total_revenue: totalRevenue.toFixed(2),
          total_transactions: totalTransactions,
          avg_transaction_value: avgTransactionValue,
          period
        }
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Топ курсов по продажам
 */
async function getTopCourses(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { limit = 10 } = req.query;
    
    const topCourses = await analyticsModel.getTopCoursesBySales(parseInt(limit));

    res.json({
      success: true,
      data: topCourses,
      count: topCourses.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Активность студентов
 */
async function getStudentActivity(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const activityStats = await analyticsModel.getStudentActivityStats();

    res.json({
      success: true,
      data: activityStats
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Детальная статистика по курсам
 */
async function getCourseEngagement(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const courseStats = await analyticsModel.getCourseEngagementStats();

    res.json({
      success: true,
      data: courseStats,
      count: courseStats.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Финансовая аналитика
 */
async function getFinancialAnalytics(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const financialData = await analyticsModel.getFinancialAnalytics(startDate, endDate);

    // Подсчитываем общую статистику
    const totalRevenue = financialData.reduce((sum, month) => sum + parseFloat(month.revenue || 0), 0);
    const totalTransactions = financialData.reduce((sum, month) => sum + parseInt(month.transaction_count || 0), 0);
    const avgGrowthRate = financialData
      .filter(month => month.growth_rate !== null)
      .reduce((sum, month, index, array) => sum + parseFloat(month.growth_rate || 0) / array.length, 0);

    res.json({
      success: true,
      data: {
        monthly_stats: financialData,
        summary: {
          total_revenue: totalRevenue.toFixed(2),
          total_transactions: totalTransactions,
          avg_growth_rate: avgGrowthRate.toFixed(2),
          period: `${startDate} to ${endDate}`
        }
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Статистика преподавателей
 */
async function getTeacherStats(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const teacherStats = await analyticsModel.getTeacherStats();

    res.json({
      success: true,
      data: teacherStats,
      count: teacherStats.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Конверсионная воронка
 */
async function getConversionFunnel(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { period = '30 days' } = req.query;
    
    const funnelData = await analyticsModel.getConversionFunnel(period);

    res.json({
      success: true,
      data: funnelData
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Системная статистика
 */
async function getSystemStats(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const systemStats = await analyticsModel.getSystemStats();

    res.json({
      success: true,
      data: systemStats
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Экспорт данных
 */
async function exportData(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { type, startDate, endDate, format = 'json' } = req.query;

    if (!type || !startDate || !endDate) {
      throw new ApiError(400, 'Type, start date and end date are required');
    }

    if (!['sales', 'students'].includes(type)) {
      throw new ApiError(400, 'Invalid export type. Use: sales, students');
    }

    const data = await analyticsModel.exportAnalyticsData(type, startDate, endDate);

    if (format === 'csv') {
      // Конвертируем в CSV
      if (data.length === 0) {
        return res.json({ success: true, data: [], message: 'No data found' });
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data,
      count: data.length,
      export_info: {
        type,
        start_date: startDate,
        end_date: endDate,
        exported_at: new Date().toISOString()
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Кастомная аналитика с фильтрами
 */
async function getCustomAnalytics(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    const { 
      startDate, 
      endDate, 
      courseId, 
      teacherId, 
      metric = 'revenue' 
    } = req.query;

    const pool = require('../config/db');
    
    let query = `
      SELECT 
        DATE_TRUNC('day', p.created_at) as date,
        COUNT(DISTINCT p.id) as payments,
        SUM(p.amount) as revenue,
        COUNT(DISTINCT p.user_id) as unique_students,
        COUNT(DISTINCT p.course_id) as unique_courses
      FROM payments p
      WHERE p.status = 'approved'
    `;
    
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND p.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND p.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND p.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (teacherId) {
      query += ` AND p.course_id IN (SELECT id FROM courses WHERE author_id = $${paramIndex})`;
      params.push(teacherId);
      paramIndex++;
    }

    query += ` GROUP BY DATE_TRUNC('day', p.created_at) ORDER BY date DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      filters: {
        start_date: startDate,
        end_date: endDate,
        course_id: courseId,
        teacher_id: teacherId,
        metric
      }
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getSalesAnalytics,
  getTopCourses,
  getStudentActivity,
  getCourseEngagement,
  getFinancialAnalytics,
  getTeacherStats,
  getConversionFunnel,
  getSystemStats,
  exportData,
  getCustomAnalytics
}; 
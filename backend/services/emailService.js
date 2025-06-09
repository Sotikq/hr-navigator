require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailQueue = [];
    this.isProcessing = false;
    this.init();
  }

  async init() {
    try {
      // Создаем транспорт для отправки email
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true для 465, false для других портов
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Проверяем подключение
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email credentials not configured, email service disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error.message);
    }
  }

  // Основная функция отправки email
  async sendEmail(to, subject, html, attachments = []) {
    if (!this.transporter) {
      logger.warn('Email service not initialized, skipping email');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'HR Navigator <noreply@hrnavigator.kz>',
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz',
      attachments
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', { to, subject, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', { to, subject, error: error.message });
      throw error;
    }
  }

  // Добавление email в очередь
  async queueEmail(emailData) {
    this.emailQueue.push({
      ...emailData,
      timestamp: new Date(),
      attempts: 0
    });

    // Запускаем обработчик очереди если он не запущен
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Обработчик очереди
  async processQueue() {
    if (this.isProcessing || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing email queue: ${this.emailQueue.length} emails`);

    while (this.emailQueue.length > 0) {
      const emailData = this.emailQueue.shift();
      
      try {
        await this.sendEmail(
          emailData.to,
          emailData.subject,
          emailData.html,
          emailData.attachments
        );
        logger.info('Email from queue sent successfully');
      } catch (error) {
        emailData.attempts++;
        
        // Повторная попытка максимум 3 раза
        if (emailData.attempts < 3) {
          this.emailQueue.push(emailData);
          logger.warn(`Email failed, retry attempt ${emailData.attempts}:`, error.message);
        } else {
          logger.error('Email failed after 3 attempts:', error.message);
        }
      }

      // Пауза между отправками
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
    logger.info('Email queue processing completed');
  }

  // ШАБЛОНЫ EMAIL

  // 1. Регистрация пользователя
  async sendWelcomeEmail(user) {
    const html = this.generateWelcomeTemplate(user);
    return this.queueEmail({
      to: user.email,
      subject: 'Добро пожаловать в HR Navigator! 🎉',
      html
    });
  }

  // 2. Подтверждение платежа
  async sendPaymentConfirmation(user, course, payment) {
    const html = this.generatePaymentConfirmationTemplate(user, course, payment);
    return this.queueEmail({
      to: user.email,
      subject: `Платеж подтвержден - ${course.title}`,
      html
    });
  }

  // 3. Отклонение платежа
  async sendPaymentRejection(user, course, payment, reason) {
    const html = this.generatePaymentRejectionTemplate(user, course, payment, reason);
    return this.queueEmail({
      to: user.email,
      subject: `Проблема с платежом - ${course.title}`,
      html
    });
  }

  // 4. Выдача сертификата
  async sendCertificateIssued(user, course, certificateUrl) {
    const html = this.generateCertificateTemplate(user, course, certificateUrl);
    return this.queueEmail({
      to: user.email,
      subject: `🎓 Ваш сертификат готов - ${course.title}`,
      html
    });
  }

  // 5. Сброс пароля
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}reset-password?token=${resetToken}`;
    const html = this.generatePasswordResetTemplate(user, resetUrl);
    return this.queueEmail({
      to: user.email,
      subject: 'Сброс пароля - HR Navigator',
      html
    });
  }

  // 6. Новый урок доступен
  async sendNewLessonNotification(user, course, lesson) {
    const html = this.generateNewLessonTemplate(user, course, lesson);
    return this.queueEmail({
      to: user.email,
      subject: `📚 Новый урок: ${lesson.title}`,
      html
    });
  }

  // 7. Массовая рассылка
  async sendBulkEmail(userList, subject, content, type = 'newsletter') {
    const html = this.generateBulkEmailTemplate(content, type);
    
    for (const user of userList) {
      await this.queueEmail({
        to: user.email,
        subject,
        html: html.replace('{{USER_NAME}}', user.name || 'Уважаемый студент')
      });
    }
  }

  // ГЕНЕРАТОРЫ ШАБЛОНОВ

  generateWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .button { background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Добро пожаловать в HR Navigator!</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>Поздравляем с успешной регистрацией в HR Navigator - вашей платформе для профессионального развития в области HR и трудового права!</p>
            
            <h3>Что вас ждет:</h3>
            <ul>
              <li>📚 Качественные курсы повышения квалификации</li>
              <li>🎓 Официальные сертификаты</li>
              <li>👨‍💼 Экспертные знания от практикующих специалистов</li>
              <li>💼 Практические кейсы и примеры</li>
            </ul>

            <p><strong>Ваши данные:</strong></p>
            <ul>
              <li>Email: ${user.email}</li>
              <li>Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}</li>
            </ul>

            <center>
              <a href="${process.env.FRONTEND_URL}" class="button">Перейти к курсам</a>
            </center>

            <p>Если у вас есть вопросы, не стесняйтесь обращаться к нам!</p>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePaymentConfirmationTemplate(user, course, payment) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .payment-details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Платеж подтвержден!</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>Отличные новости! Ваш платеж за курс успешно обработан и подтвержден.</p>
            
            <div class="payment-details">
              <h3>📋 Детали заказа:</h3>
              <p><strong>Курс:</strong> ${course.title}</p>
              <p><strong>Сумма:</strong> ${payment.amount || course.price} ₸</p>
              <p><strong>Дата платежа:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
              <p><strong>ID транзакции:</strong> ${payment.id || 'N/A'}</p>
            </div>

            <p>Теперь вам доступны все материалы курса. Вы можете приступить к обучению прямо сейчас!</p>

            <center>
              <a href="${process.env.FRONTEND_URL}courses/${course.id}" class="button">Начать обучение</a>
            </center>

            <p><strong>Что дальше?</strong></p>
            <ul>
              <li>📖 Изучайте материалы в удобном темпе</li>
              <li>📝 Выполняйте практические задания</li>
              <li>🎓 Получите сертификат после завершения курса</li>
            </ul>

            <p>Желаем успешного обучения!</p>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePaymentRejectionTemplate(user, course, payment, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336, #ef5350); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .error-box { background: #ffebee; border: 1px solid #f44336; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Проблема с платежом</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>К сожалению, при обработке вашего платежа за курс "${course.title}" возникла проблема.</p>
            
            <div class="error-box">
              <h3>🚨 Причина отклонения:</h3>
              <p>${reason || 'Платеж не прошел проверку банка'}</p>
            </div>

            <p><strong>Что вы можете сделать:</strong></p>
            <ul>
              <li>💳 Проверьте данные карты и попробуйте еще раз</li>
              <li>💰 Убедитесь в наличии достаточных средств</li>
              <li>📞 Свяжитесь с банком для уточнения</li>
              <li>📧 Напишите нам для альтернативных способов оплаты</li>
            </ul>

            <center>
              <a href="${process.env.FRONTEND_URL}courses/${course.id}" class="button">Попробовать снова</a>
            </center>

            <p>Если проблема повторится, обратитесь к нам за помощью. Мы поможем решить любые вопросы с оплатой!</p>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'} | Поддержка: +7 (XXX) XXX-XX-XX</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateCertificateTemplate(user, course, certificateUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9800, #ffb74d); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .certificate-box { background: #fff9c4; border: 2px solid #ff9800; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
          .button { background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Поздравляем с получением сертификата!</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>🎉 Поздравляем! Вы успешно завершили курс и заслужили официальный сертификат!</p>
            
            <div class="certificate-box">
              <h3>📜 Ваш сертификат готов</h3>
              <p><strong>Курс:</strong> ${course.title}</p>
              <p><strong>Объем:</strong> ${course.duration} часов</p>
              <p><strong>Дата выдачи:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
              <p>Этот сертификат подтверждает ваше профессиональное развитие и может быть использован в карьерных целях.</p>
            </div>

            <center>
              <a href="${certificateUrl}" class="button">📥 Скачать сертификат</a>
              <a href="${process.env.FRONTEND_URL}profile/certificates" class="button">🏆 Мои сертификаты</a>
            </center>

            <p><strong>Сертификат включает:</strong></p>
            <ul>
              <li>✅ Официальное подтверждение прохождения курса</li>
              <li>✅ QR-код для онлайн верификации</li>
              <li>✅ Печать и подпись организации</li>
              <li>✅ Уникальный номер для проверки</li>
            </ul>

            <p>Продолжайте развиваться с HR Navigator! У нас есть много других интересных курсов.</p>
          </div>
          <div class="footer">
            <p>С гордостью, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetTemplate(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9c27b0, #ba68c8); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .security-box { background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #9c27b0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Сброс пароля</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>Мы получили запрос на сброс пароля для вашего аккаунта в HR Navigator.</p>
            
            <div class="security-box">
              <h3>🛡️ Инструкции по безопасности:</h3>
              <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш аккаунт остается в безопасности.</p>
            </div>

            <center>
              <a href="${resetUrl}" class="button">Установить новый пароль</a>
            </center>

            <p><strong>⏰ Важно:</strong> Ссылка действительна только в течение 1 часа с момента получения письма.</p>

            <p>После перехода по ссылке вы сможете установить новый пароль и снова получить доступ к своему аккаунту.</p>

            <p>Если у вас возникли проблемы с переходом по ссылке, скопируйте и вставьте следующий адрес в браузер:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateNewLessonTemplate(user, course, lesson) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2196f3, #64b5f6); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .lesson-box { background: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Новый урок доступен!</h1>
          </div>
          <div class="content">
            <h2>Привет, ${user.name}!</h2>
            <p>У нас отличные новости! В курсе "${course.title}" появился новый урок.</p>
            
            <div class="lesson-box">
              <h3>📖 ${lesson.title}</h3>
              <p>${lesson.description || 'Новый материал для изучения'}</p>
              <p><strong>Продолжительность:</strong> ${lesson.duration || 'N/A'} минут</p>
            </div>

            <center>
              <a href="${process.env.FRONTEND_URL}courses/${course.id}/lessons/${lesson.id}" class="button">Перейти к уроку</a>
            </center>

            <p>Продолжайте обучение и приближайтесь к получению сертификата!</p>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateBulkEmailTemplate(content, type) {
    const typeStyles = {
      newsletter: { color: '#1976d2', icon: '📰' },
      promotion: { color: '#f44336', icon: '🎉' },
      announcement: { color: '#ff9800', icon: '📢' },
      update: { color: '#4caf50', icon: '🔄' }
    };

    const style = typeStyles[type] || typeStyles.newsletter;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${style.color}, ${style.color}dd); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .button { background: ${style.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${style.icon} HR Navigator</h1>
          </div>
          <div class="content">
            <h2>Привет, {{USER_NAME}}!</h2>
            ${content}
            
            <center>
              <a href="${process.env.FRONTEND_URL}" class="button">Перейти на сайт</a>
            </center>
          </div>
          <div class="footer">
            <p>С уважением, команда HR Navigator<br>
            Email: ${process.env.EMAIL_REPLY_TO || 'admin@hrnavigator.kz'}<br>
            <a href="${process.env.FRONTEND_URL}unsubscribe">Отписаться от рассылки</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Создаем единственный экземпляр сервиса
const emailService = new EmailService();

module.exports = emailService; 
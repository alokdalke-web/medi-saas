const { getBrevoClient } = require('../config/brevo');
const { generateAppointmentConfirmationTemplate } = require('../templates/appointmentConfirmation');
const { generateDoctorBookingNotificationTemplate } = require('../templates/doctorBookingNotification');
const { generateAppointmentCancelledTemplate } = require('../templates/appointmentCancelled');
const { generateAppointmentRescheduledTemplate } = require('../templates/appointmentRescheduled');

/**
 * Service to handle sending notifications using Brevo Transactional Email API
 */
class NotificationService {
  /**
   * Sends an appointment confirmation email to the patient
   */
  static async sendAppointmentConfirmation(data) {
    try {
      if (!data.patientEmail) {
        console.warn('[NotificationService] Missing patient email. Cannot send confirmation.');
        return false;
      }

      if (!process.env.BREVO_API_KEY) {
        console.warn('[NotificationService] BREVO_API_KEY is not set. Email not sent.');
        return false;
      }

      const client = getBrevoClient();
      
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@clinicflow.com';
      const senderName = process.env.BREVO_SENDER_NAME || data.clinicName;

      // Send the email
      const result = await client.transactionalEmails.sendTransacEmail({
        subject: `Appointment Confirmed - ${data.clinicName}`,
        htmlContent: generateAppointmentConfirmationTemplate(data),
        sender: { name: senderName, email: senderEmail },
        to: [{ email: data.patientEmail, name: data.patientName }]
      });

      console.log(`[NotificationService] Appointment confirmation email sent to ${data.patientEmail}. MsgId: ${result.messageId}`);
      return true;

    } catch (error) {
      console.error('[NotificationService] Failed to send appointment confirmation email:', error.message);
      return false;
    }
  }

  static async sendDoctorBookingNotification(data) {
    try {
      if (!data.doctorEmail || !process.env.BREVO_API_KEY) return false;
      const client = getBrevoClient();
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@clinicflow.com';
      const senderName = process.env.BREVO_SENDER_NAME || data.clinicName;

      await client.transactionalEmails.sendTransacEmail({
        subject: `New Appointment Booked - ${data.clinicName}`,
        htmlContent: generateDoctorBookingNotificationTemplate(data),
        sender: { name: senderName, email: senderEmail },
        to: [{ email: data.doctorEmail, name: data.doctorName }]
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to send doctor booking email:', error.message);
      return false;
    }
  }

  static async sendCancellationNotification(data, toEmail, toName) {
    try {
      if (!toEmail || !process.env.BREVO_API_KEY) return false;
      const client = getBrevoClient();
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@clinicflow.com';
      const senderName = process.env.BREVO_SENDER_NAME || data.clinicName;

      await client.transactionalEmails.sendTransacEmail({
        subject: `Appointment Cancelled - ${data.clinicName}`,
        htmlContent: generateAppointmentCancelledTemplate({ ...data, recipientName: toName }),
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName }]
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to send cancellation email:', error.message);
      return false;
    }
  }

  static async sendRescheduleNotification(data, toEmail, toName) {
    try {
      if (!toEmail || !process.env.BREVO_API_KEY) return false;
      const client = getBrevoClient();
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@clinicflow.com';
      const senderName = process.env.BREVO_SENDER_NAME || data.clinicName;

      await client.transactionalEmails.sendTransacEmail({
        subject: `Appointment Rescheduled - ${data.clinicName}`,
        htmlContent: generateAppointmentRescheduledTemplate({ ...data, recipientName: toName }),
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail, name: toName }]
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to send reschedule email:', error.message);
      return false;
    }
  }
}

module.exports = NotificationService;

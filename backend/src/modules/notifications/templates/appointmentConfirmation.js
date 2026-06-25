/**
 * Generates responsive HTML template for appointment confirmation email
 * @param {Object} data
 * @param {string} data.clinicName
 * @param {string} data.patientName
 * @param {string} data.doctorName
 * @param {string} data.appointmentDate
 * @param {string} data.appointmentTime
 * @param {string} data.appointmentId
 * @param {string} data.clinicPhone
 * @returns {string} HTML string
 */
exports.generateAppointmentConfirmationTemplate = (data) => {
  const {
    clinicName,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    appointmentId,
    clinicPhone
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f4f7f6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #0056b3;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 20px;
      margin-top: 20px;
    }
    .card p {
      margin: 10px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .logo-placeholder {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-placeholder">${clinicName}</div>
      <h1>Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${patientName}</strong>,</p>
      <p>Your appointment has been successfully confirmed.</p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #0056b3;">Appointment Details</h3>
        <p><strong>Appointment ID:</strong> ${appointmentId}</p>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
      </div>

      <div style="margin-top: 30px;">
        <p><strong>Clinic:</strong><br>${clinicName}</p>
        <p><strong>Contact Number:</strong><br>${clinicPhone}</p>
      </div>
      
      <p style="margin-top: 30px;">Thank you for choosing ${clinicName}.</p>
    </div>
    <div class="footer">
      This is an automated message. For any queries, please contact ${clinicPhone}.
    </div>
  </div>
</body>
</html>
  `;
};

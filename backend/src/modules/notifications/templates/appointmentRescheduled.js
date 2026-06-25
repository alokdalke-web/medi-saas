exports.generateAppointmentRescheduledTemplate = (data) => {
  const {
    clinicName,
    recipientName,
    newAppointmentDate,
    newAppointmentTime,
    appointmentId,
    clinicPhone
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Rescheduled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f7f6; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background-color: #ffc107; color: #333333; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin-top: 20px; }
    .card p { margin: 10px 0; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appointment Rescheduled</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Please note that your appointment has been successfully <strong>rescheduled</strong>.</p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #d39e00;">New Appointment Details</h3>
        <p><strong>New Date:</strong> ${newAppointmentDate}</p>
        <p><strong>New Time:</strong> ${newAppointmentTime}</p>
        <p><strong>Appt ID:</strong> ${appointmentId}</p>
      </div>

      <p style="margin-top: 30px;">If this was done in error or you need to make further changes, please contact ${clinicName} at ${clinicPhone}.</p>
    </div>
    <div class="footer">
      Automated notification from ${clinicName}
    </div>
  </div>
</body>
</html>
  `;
};

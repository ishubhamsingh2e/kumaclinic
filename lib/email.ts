import nodemailer from "nodemailer";
import { format } from "date-fns";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface AppointmentEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  doctorTitle?: string;
  clinicName: string;
  appointmentDate: Date;
  appointmentTime: string;
  reason?: string;
  clinicAddress?: string;
}

export async function sendAppointmentConfirmationEmail(
  data: AppointmentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify transporter configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("SMTP credentials not configured. Email not sent.");
      return { success: false, error: "SMTP not configured" };
    }

    const doctorFullName = data.doctorTitle
      ? `${data.doctorTitle} ${data.doctorName}`
      : data.doctorName;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>Your appointment has been successfully scheduled. Here are the details:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Doctor:</span>
                  <span class="value">${doctorFullName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Clinic:</span>
                  <span class="value">${data.clinicName}</span>
                </div>
                ${
                  data.clinicAddress
                    ? `<div class="detail-row">
                  <span class="label">Address:</span>
                  <span class="value">${data.clinicAddress}</span>
                </div>`
                    : ""
                }
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${format(data.appointmentDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${data.appointmentTime}</span>
                </div>
                ${
                  data.reason
                    ? `<div class="detail-row">
                  <span class="label">Reason:</span>
                  <span class="value">${data.reason}</span>
                </div>`
                    : ""
                }
              </div>
              
              <p>Please arrive 10 minutes before your scheduled time.</p>
              <p>If you need to reschedule or cancel, please contact the clinic as soon as possible.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Dear ${data.patientName},

Your appointment has been successfully scheduled.

Appointment Details:
Doctor: ${doctorFullName}
Clinic: ${data.clinicName}
${data.clinicAddress ? `Address: ${data.clinicAddress}` : ""}
Date: ${format(data.appointmentDate, "EEEE, MMMM d, yyyy")}
Time: ${data.appointmentTime}
${data.reason ? `Reason: ${data.reason}` : ""}

Please arrive 10 minutes before your scheduled time.
If you need to reschedule or cancel, please contact the clinic as soon as possible.

This is an automated message. Please do not reply to this email.
    `;

    await transporter.sendMail({
      from: `"${data.clinicName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.to,
      subject: `Appointment Confirmation - ${format(data.appointmentDate, "MMM d, yyyy")}`,
      text: emailText,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending appointment email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendDoctorAppointmentNotification(
  data: AppointmentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify transporter configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("SMTP credentials not configured. Email not sent.");
      return { success: false, error: "SMTP not configured" };
    }

    const doctorFullName = data.doctorTitle
      ? `${data.doctorTitle} ${data.doctorName}`
      : data.doctorName;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Appointment</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Appointment Scheduled</h1>
            </div>
            <div class="content">
              <p>Dear ${doctorFullName},</p>
              <p>A new appointment has been scheduled with you:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Patient:</span>
                  <span class="value">${data.patientName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Clinic:</span>
                  <span class="value">${data.clinicName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${format(data.appointmentDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${data.appointmentTime}</span>
                </div>
                ${
                  data.reason
                    ? `<div class="detail-row">
                  <span class="label">Reason:</span>
                  <span class="value">${data.reason}</span>
                </div>`
                    : ""
                }
              </div>
              
              <p>Please review your schedule and prepare accordingly.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Dear ${doctorFullName},

A new appointment has been scheduled with you:

Appointment Details:
Patient: ${data.patientName}
Clinic: ${data.clinicName}
Date: ${format(data.appointmentDate, "EEEE, MMMM d, yyyy")}
Time: ${data.appointmentTime}
${data.reason ? `Reason: ${data.reason}` : ""}

Please review your schedule and prepare accordingly.

This is an automated message. Please do not reply to this email.
    `;

    await transporter.sendMail({
      from: `"${data.clinicName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.to,
      subject: `New Appointment - ${data.patientName} (${format(data.appointmentDate, "MMM d, yyyy")})`,
      text: emailText,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending doctor notification email:", error);
    return { success: false, error: error.message };
  }
}

// Console log for WhatsApp/SMS (to be implemented in future)
export function logWhatsAppMessage(phone: string, message: string) {
  console.log("\n📱 WhatsApp Message (Not Implemented):");
  console.log(`To: ${phone}`);
  console.log(`Message: ${message}`);
  console.log("---\n");
}

export function logSMSMessage(phone: string, message: string) {
  console.log("\n💬 SMS Message (Not Implemented):");
  console.log(`To: ${phone}`);
  console.log(`Message: ${message}`);
  console.log("---\n");
}

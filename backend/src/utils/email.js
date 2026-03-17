import "../config/env.js";
import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailPass) {
  console.error("[email] Faltan GMAIL_USER o GMAIL_APP_PASSWORD");
}

console.log("[email] usando SMTP gmail puerto 587");
console.error("[email] error real:", error);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("[email] SMTP de Gmail listo");
  } catch (error) {
    console.error("[email] Error verificando SMTP:", error);
  }
}

export async function sendVerificationEmail(to, code) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifica tu cuenta – GreenNode</title>
</head>
<body style="margin:0;padding:0;background:#f4f8f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          <tr>
            <td style="background:#2d6a4f;padding:32px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">GreenNode</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1f2937;">Verifica tu cuenta</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Usa el siguiente código para confirmar tu correo electrónico en GreenNode.
              </p>
              <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#2d6a4f;font-family:monospace;">${code}</div>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Este código expira en <strong>15 minutos</strong>.</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Si no solicitaste este código, puedes ignorar este mensaje con seguridad.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: `"GreenNode" <${gmailUser}>`,
      to,
      subject: "Código de verificación – GreenNode",
      html,
    });

    console.log("[email] Correo enviado:", info.response);
    return info;
  } catch (error) {
    console.error("[email] Error enviando correo:", error);
    throw error;
  }
}
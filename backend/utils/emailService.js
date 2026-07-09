const nodemailer = require('nodemailer');
const axios = require('axios');

const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();

const getSelectedProvider = () => {
  if (EMAIL_PROVIDER) {
    return EMAIL_PROVIDER;
  }

  if (process.env.BREVO_API_KEY) {
    return 'brevo';
  }

  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }

  return 'smtp';
};

const shouldFailOnEmailError = () => {
  return String(process.env.SMTP_STRICT || 'false').toLowerCase() === 'true';
};

const parseSender = () => {
  const rawFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
  const trimmed = rawFrom.trim();

  const displayMatch = trimmed.match(/^(.+?)\s*<([^<>\s]+@[^<>\s]+)>$/);

  if (displayMatch) {
    return {
      raw: trimmed,
      name: displayMatch[1].replace(/^['"]|['"]$/g, '').trim() || process.env.APP_NAME || 'Meridian.ai',
      email: displayMatch[2].trim(),
    };
  }

  return {
    raw: trimmed,
    name: process.env.APP_NAME || 'Meridian.ai',
    email: trimmed,
  };
};

const isEmailConfigured = () => {
  const provider = getSelectedProvider();
  const sender = parseSender();

  if (!sender.email) {
    return false;
  }

  if (provider === 'brevo') {
    return Boolean(process.env.BREVO_API_KEY);
  }

  if (provider === 'resend') {
    return Boolean(process.env.RESEND_API_KEY);
  }

  return Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
};

const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE
    ? String(process.env.EMAIL_SECURE).toLowerCase() === 'true'
    : port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const sender = parseSender();

  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: sender.name,
        email: sender.email,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    },
    {
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      timeout: 15000,
    }
  );
};

const sendWithResend = async ({ to, subject, text, html }) => {
  const sender = parseSender();

  await axios.post(
    'https://api.resend.com/emails',
    {
      from: sender.raw || `${sender.name} <${sender.email}>`,
      to: [to],
      subject,
      html,
      text,
    },
    {
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      timeout: 15000,
    }
  );
};

const sendWithSmtp = async ({ to, subject, text, html }) => {
  const sender = parseSender();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: sender.raw || sender.email,
    to,
    subject,
    text,
    html,
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const provider = getSelectedProvider();

  if (provider === 'brevo') {
    return sendWithBrevo({ to, subject, text, html });
  }

  if (provider === 'resend') {
    return sendWithResend({ to, subject, text, html });
  }

  return sendWithSmtp({ to, subject, text, html });
};

const getProviderLabel = () => {
  const provider = getSelectedProvider();
  if (provider === 'brevo') return 'Brevo Email API';
  if (provider === 'resend') return 'Resend Email API';
  return 'SMTP';
};

const getErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message || error?.response?.data?.error || error?.response?.data?.name;
  return apiMessage || error.message || 'Unknown email delivery error';
};

const logLoginCodeFallback = ({ to, code, reason }) => {
  console.warn('[Email] Login code was not emailed. Using development fallback.');
  if (reason) {
    console.warn(`[Email] Reason: ${reason}`);
  }
  console.warn(`[Email] Development login code for ${to}: ${code}`);
};

const logRegistrationCodeFallback = ({ to, code, reason }) => {
  console.warn('[Email] Registration code was not emailed. Using development fallback.');
  if (reason) {
    console.warn(`[Email] Reason: ${reason}`);
  }
  console.warn(`[Email] Development registration code for ${to}: ${code}`);
};

const logPasswordResetFallback = ({ to, resetLink, reason }) => {
  console.warn('[Email] Password reset link was not emailed. Using development fallback.');
  if (reason) {
    console.warn(`[Email] Reason: ${reason}`);
  }
  console.warn(`[Email] Development password reset link for ${to}: ${resetLink}`);
};

const sendRegistrationCodeEmail = async ({ to, username, code }) => {
  const appName = process.env.APP_NAME || 'Meridian.ai';

  if (!isEmailConfigured()) {
    logRegistrationCodeFallback({ to, code, reason: `${getProviderLabel()} is not configured.` });
    return { sent: false, devFallback: true };
  }

  try {
    await sendEmail({
      to,
      subject: `${appName} registration verification code`,
      text: `Hello ${username || 'there'},\n\nYour ${appName} registration verification code is ${code}.\n\nThis code will expire in 10 minutes. If you did not try to create an account, you can safely ignore this email.\n\n- ${appName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px;">
          <h2 style="margin:0 0 12px;color:#4f46e5;">${appName} Registration Code</h2>
          <p>Hello ${username || 'there'},</p>
          <p>Use this verification code to finish creating your account:</p>
          <div style="font-size:30px;font-weight:800;letter-spacing:8px;background:#f3f4f6;border-radius:12px;padding:16px;text-align:center;margin:18px 0;color:#111827;">
            ${code}
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size:13px;color:#6b7280;">If you did not try to create an account, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`[Email] Registration code delivered to ${to} using ${getProviderLabel()}.`);
    return { sent: true, devFallback: false };
  } catch (error) {
    const reason = getErrorMessage(error);
    console.error('[Email] Failed to send registration code:', reason);

    if (shouldFailOnEmailError()) {
      throw new Error('Unable to send registration verification code. Please check email configuration.');
    }

    logRegistrationCodeFallback({ to, code, reason });
    return { sent: false, devFallback: true };
  }
};

const sendLoginCodeEmail = async ({ to, username, code }) => {
  const appName = process.env.APP_NAME || 'Meridian.ai';

  if (!isEmailConfigured()) {
    logLoginCodeFallback({ to, code, reason: `${getProviderLabel()} is not configured.` });
    return { sent: false, devFallback: true };
  }

  try {
    await sendEmail({
      to,
      subject: `${appName} login authentication code`,
      text: `Hello ${username || 'there'},\n\nYour ${appName} login authentication code is ${code}.\n\nThis code will expire in 10 minutes. If you did not try to login, you can safely ignore this email.\n\n- ${appName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px;">
          <h2 style="margin:0 0 12px;color:#4f46e5;">${appName} Login Code</h2>
          <p>Hello ${username || 'there'},</p>
          <p>Use this authentication code to complete your login:</p>
          <div style="font-size:30px;font-weight:800;letter-spacing:8px;background:#f3f4f6;border-radius:12px;padding:16px;text-align:center;margin:18px 0;color:#111827;">
            ${code}
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size:13px;color:#6b7280;">If you did not try to login, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`[Email] Login code delivered to ${to} using ${getProviderLabel()}.`);
    return { sent: true, devFallback: false };
  } catch (error) {
    const reason = getErrorMessage(error);
    console.error('[Email] Failed to send login code:', reason);

    if (shouldFailOnEmailError()) {
      throw new Error('Unable to send authentication code. Please check email configuration.');
    }

    logLoginCodeFallback({ to, code, reason });
    return { sent: false, devFallback: true };
  }
};

const sendPasswordResetEmail = async ({ to, username, resetLink, expiresInMinutes = 15 }) => {
  const appName = process.env.APP_NAME || 'Meridian.ai';

  if (!isEmailConfigured()) {
    logPasswordResetFallback({ to, resetLink, reason: `${getProviderLabel()} is not configured.` });
    return { sent: false, devFallback: true };
  }

  try {
    await sendEmail({
      to,
      subject: `${appName} password reset request`,
      text: `Hello ${username || 'there'},\n\nUse this link to reset your ${appName} password:\n${resetLink}\n\nThis link will expire in ${expiresInMinutes} minutes. If you did not request this, you can safely ignore this email.\n\n- ${appName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px;">
          <h2 style="margin:0 0 12px;color:#4f46e5;">Reset your ${appName} password</h2>
          <p>Hello ${username || 'there'},</p>
          <p>Click the button below to reset your password:</p>
          <p style="margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
          <p style="font-size:13px;color:#6b7280;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="font-size:12px;word-break:break-all;color:#4f46e5;">${resetLink}</p>
          <p style="font-size:13px;color:#6b7280;">If you did not request this email, you can safely ignore it.</p>
        </div>
      `,
    });

    console.log(`[Email] Password reset email delivered to ${to} using ${getProviderLabel()}.`);
    return { sent: true, devFallback: false };
  } catch (error) {
    const reason = getErrorMessage(error);
    console.error('[Email] Failed to send password reset email:', reason);

    if (shouldFailOnEmailError()) {
      throw new Error('Unable to send password reset email. Please check email configuration.');
    }

    logPasswordResetFallback({ to, resetLink, reason });
    return { sent: false, devFallback: true };
  }
};

module.exports = {
  sendRegistrationCodeEmail,
  sendLoginCodeEmail,
  sendPasswordResetEmail,
};

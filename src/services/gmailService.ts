import { getGmailAccessToken } from './authService';
import { Ride } from '../types';

export interface SendEmailOptions {
  to: string;
  subject: string;
  bodyText?: string;
  htmlBody?: string;
}

/**
 * Base64URL encode string for Gmail API RFC 2822 payload
 */
function base64UrlEncode(str: string): string {
  // UTF-8 encode before base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send an email using official Gmail API endpoint
 */
export const sendGmailMessage = async (options: SendEmailOptions, tokenOverride?: string): Promise<{ id: string; threadId: string }> => {
  const token = tokenOverride || getGmailAccessToken();

  if (!token) {
    throw new Error('GMAIL_TOKEN_REQUIRED');
  }

  const { to, subject, bodyText, htmlBody } = options;

  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    htmlBody || bodyText || ''
  ];

  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = base64UrlEncode(rawEmail);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Gmail API Error (${response.status})`);
  }

  return await response.json();
};

/**
 * Get current user's Gmail profile
 */
export const getGmailProfile = async (tokenOverride?: string): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number }> => {
  const token = tokenOverride || getGmailAccessToken();
  if (!token) {
    throw new Error('GMAIL_TOKEN_REQUIRED');
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Gmail API Profile Error (${response.status})`);
  }

  return await response.json();
};

/**
 * Send a clean Ride Receipt HTML email via Gmail
 */
export const sendRideReceiptEmail = async (
  ride: Ride,
  recipientEmail: string,
  tokenOverride?: string
): Promise<{ id: string }> => {
  const subject = `إيصال رحلة MotoDrive #${ride.id.slice(-6).toUpperCase()} - ${ride.finalPrice} دج`;

  const htmlBody = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 24px; text-align: center; color: #0f172a;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">MotoDrive - موتو درايف</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">إيصال رحلة رسمية برقم #${ride.id.slice(-6).toUpperCase()}</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 16px;">تفاصيل الأجرة</h3>
          <p style="margin: 4px 0; font-size: 20px; font-weight: bold; color: #10b981;">المبلغ الإجمالي: ${ride.finalPrice} دج</p>
          <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">طريقة الدفع: نقداً / Cash</p>
        </div>

        <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 16px;">مسار الرحلة</h3>
          <p style="margin: 6px 0; font-size: 14px; color: #e2e8f0;">📍 <strong>الانطلاق:</strong> ${ride.pickup?.name || ride.pickup?.address || 'موقع الانطلاق'}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #e2e8f0;">🏁 <strong>الوصول:</strong> ${ride.destination?.name || ride.destination?.address || 'موقع الوصول'}</p>
          <p style="margin: 6px 0; font-size: 13px; color: #94a3b8;">📏 المسافة التقريبية: ${ride.distanceKm || 0} كم</p>
        </div>

        ${
          ride.driverName
            ? `
        <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; color: #f59e0b; font-size: 16px;">معلومات السائق</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #e2e8f0;">👤 <strong>اسم السائق:</strong> ${ride.driverName}</p>
          ${ride.driverPhone ? `<p style="margin: 4px 0; font-size: 14px; color: #e2e8f0;">📞 <strong>الهاتف:</strong> ${ride.driverPhone}</p>` : ''}
        </div>
        `
            : ''
        }

        <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 24px;">
          شكراً لاستخدامك منصة MotoDrive لنقل الأشخاص بالدراجات النارية في الجزائر! 🚀
        </p>
      </div>
    </div>
  `;

  return await sendGmailMessage(
    {
      to: recipientEmail,
      subject,
      htmlBody,
    },
    tokenOverride
  );
};

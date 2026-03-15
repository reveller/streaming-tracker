/**
 * Email Service
 *
 * Sends emails via AWS SES for invitation and notification purposes.
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Create and configure the SES client singleton.
 *
 * @returns {SESClient} Configured AWS SES client
 */
function createSesClient() {
  const region = process.env.AWS_SES_REGION || 'us-east-1';
  return new SESClient({ region });
}

let sesClient = null;

/**
 * Get the SES client instance (lazy initialization).
 *
 * @returns {SESClient} AWS SES client
 */
function getSesClient() {
  if (!sesClient) {
    sesClient = createSesClient();
  }
  return sesClient;
}

/**
 * Send an invitation email to a prospective user.
 *
 * @param {string} email - Recipient email address
 * @param {string} token - Invitation token for the registration link
 * @param {string} inviterUsername - Username of the person who sent the invite
 * @returns {Promise<Object>} SES send result
 * @throws {Error} If email sending fails
 */
export async function sendInvitationEmail(email, token, inviterUsername) {
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@n2deep.co';
  const frontendUrl = process.env.FRONTEND_URL || 'https://tracker.n2deep.co';
  const registrationLink = `${frontendUrl}/register?token=${encodeURIComponent(token)}`;
  const expiryMinutes = parseInt(process.env.INVITATION_EXPIRY_MINUTES, 10) || 10;

  const subject = 'You\'ve been invited to Streaming Tracker';

  const htmlBody = buildInvitationHtml({
    inviterUsername,
    registrationLink,
    expiryMinutes,
  });

  const textBody = buildInvitationText({
    inviterUsername,
    registrationLink,
    expiryMinutes,
  });

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
        Text: {
          Charset: 'UTF-8',
          Data: textBody,
        },
      },
    },
  });

  const client = getSesClient();
  const result = await client.send(command);
  return result;
}

/**
 * Build the HTML body for an invitation email.
 *
 * @param {Object} params - Template parameters
 * @param {string} params.inviterUsername - Name of inviter
 * @param {string} params.registrationLink - Full registration URL
 * @param {number} params.expiryMinutes - Minutes until link expires
 * @returns {string} HTML email body
 */
function buildInvitationHtml({ inviterUsername, registrationLink, expiryMinutes }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #1a1a2e; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px;">Streaming Tracker</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: #333333; margin-top: 0;">You're Invited!</h2>
        <p style="color: #555555; line-height: 1.6;">
          <strong>${inviterUsername}</strong> has invited you to join Streaming Tracker,
          a tool for managing and tracking your movies and TV series across streaming services.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <a href="${registrationLink}"
                 style="display: inline-block; padding: 14px 30px; background-color: #e94560;
                        color: #ffffff; text-decoration: none; border-radius: 5px;
                        font-size: 16px; font-weight: bold;">
                Accept Invitation
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #888888; font-size: 13px; line-height: 1.5;">
          This invitation link expires in <strong>${expiryMinutes} minutes</strong> and can only be used once.
          If the button above doesn't work, copy and paste this URL into your browser:
        </p>
        <p style="color: #888888; font-size: 12px; word-break: break-all;">
          ${registrationLink}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; text-align: center; background-color: #f4f4f4; color: #999999; font-size: 12px;">
        <p style="margin: 0;">Streaming Tracker &mdash; Track your entertainment</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build the plain text body for an invitation email.
 *
 * @param {Object} params - Template parameters
 * @param {string} params.inviterUsername - Name of inviter
 * @param {string} params.registrationLink - Full registration URL
 * @param {number} params.expiryMinutes - Minutes until link expires
 * @returns {string} Plain text email body
 */
function buildInvitationText({ inviterUsername, registrationLink, expiryMinutes }) {
  return [
    'You\'re Invited to Streaming Tracker!',
    '',
    `${inviterUsername} has invited you to join Streaming Tracker, a tool for managing and tracking your movies and TV series across streaming services.`,
    '',
    `Click the link below to accept your invitation and create your account:`,
    '',
    registrationLink,
    '',
    `This invitation link expires in ${expiryMinutes} minutes and can only be used once.`,
    '',
    '---',
    'Streaming Tracker - Track your entertainment',
  ].join('\n');
}

/**
 * Reset the SES client (useful for testing).
 */
export function _resetClient() {
  sesClient = null;
}

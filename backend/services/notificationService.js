import nodemailer from 'nodemailer';
import axios from 'axios';

export const sendCriticalAlert = async (ticket) => {
  const isCritical = 
    (ticket.churnRisk || '').toLowerCase() === 'high' || 
    (ticket.sentiment || '').toLowerCase() === 'angry' || 
    (ticket.priority || '').toLowerCase() === 'high';

  if (!isCritical) {
    return;
  }

  console.log(`\n🔔 [ALERT SERVICE] Processing critical alert for ticket ID: ${ticket._id || ticket.id || 'Local'}`);

  const customerName = ticket.customerName || 'Customer';
  const email = ticket.email || 'N/A';
  const message = ticket.message || '';
  const category = ticket.category || 'General';
  const sentiment = ticket.sentiment || 'Neutral';
  const churnRisk = ticket.churnRisk || 'Medium';
  const riskScore = ticket.riskScore || 50;
  const slaHours = ticket.slaHours || 24;
  const summary = ticket.summary || 'No summary generated.';
  const recommendedAction = ticket.recommendedAction || 'No recommended action.';
  const suggestedReply = ticket.suggestedReply || 'No reply suggested.';

  // --- 1. SLACK / DISCORD WEBHOOK ALERT ---
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const isSlackConfigured = webhookUrl && !webhookUrl.includes('your_') && webhookUrl.trim() !== '';

  const slackPayload = {
    text: `🚨 *Critical Support Alert:* customer churn risk identified for *${customerName}*`,
    attachments: [
      {
        color: '#ef4444',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 CRITICAL TICKETS NOTIFICATION*\n\n*Customer:* ${customerName} (${email})\n*Category:* ${category} · *Sentiment:* ${sentiment}\n*Churn Risk:* ${churnRisk} (Score: ${riskScore}/100) · *SLA Target:* ${slaHours}h`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Original Complaint:*\n> ${message}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*AI Generated Summary:*\n_${summary}_\n\n*Recommended Resolution Action:*\n\`${recommendedAction}\``
            }
          }
        ]
      }
    ]
  };

  if (isSlackConfigured) {
    try {
      await axios.post(webhookUrl, slackPayload);
      console.log('✓ [ALERT SERVICE] Slack webhook alert delivered successfully.');
    } catch (err) {
      console.error('✗ [ALERT SERVICE] Slack webhook request failed:', err.message);
    }
  } else {
    // Mock Slack Alert Logging
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MOCK SLACK WEBHOOK ALERT (NO DESTINATION)                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Message: ${slackPayload.text}
║ Details:
║   • Customer: ${customerName} (${email})
║   • Category: ${category} | Sentiment: ${sentiment}
║   • Churn Risk: ${churnRisk} (Score: ${riskScore}/100) | SLA: ${slaHours}h
║   • AI Summary: ${summary.slice(0, 120)}${summary.length > 120 ? '...' : ''}
║   • Recommended Action: ${recommendedAction}
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  // --- 2. EMAIL SMTP ALERT ---
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  const isEmailConfigured = 
    smtpHost && !smtpHost.includes('your_') && 
    smtpUser && !smtpUser.includes('your_') && 
    smtpPass && !smtpPass.includes('your_');

  const emailSubject = `🚨 [CRITICAL ALERT] ${category} Complaint from ${customerName}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #070b16; color: #f8fafc; padding: 25px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px;">
        <span style="color: #ef4444; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">CareMind AI Retention Gate</span>
        <h2 style="color: #ffffff; margin-top: 5px; margin-bottom: 5px;">🚨 Critical Retention Case Detected</h2>
        <span style="color: #94a3b8; font-size: 13px;">Immediate support intervention required</span>
      </div>

      <div style="background-color: #0f172a; border-radius: 12px; padding: 15px; border: 1px solid #334155; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div><strong>Customer:</strong> <span style="color: #38bdf8;">${customerName}</span></div>
        <div><strong>Email:</strong> <span style="color: #cbd5e1;">${email}</span></div>
        <div><strong>Category:</strong> <span style="color: #cbd5e1;">${category}</span></div>
        <div><strong>Sentiment:</strong> <span style="color: #f87171;">${sentiment}</span></div>
        <div><strong>Churn Risk:</strong> <span style="color: #f87171; font-weight: bold;">${churnRisk} (${riskScore}/100)</span></div>
        <div><strong>SLA Window:</strong> <span style="color: #fbbf24; font-weight: bold;">${slaHours} Hours</span></div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; font-size: 11px; letter-spacing: 1px;">Original Customer Complaint</h4>
        <div style="background-color: #020617; border-left: 4px solid #ef4444; padding: 12px; font-style: italic; border-radius: 4px; color: #e2e8f0; font-size: 14px;">
          "${message}"
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; font-size: 11px; letter-spacing: 1px;">AI Summary</h4>
        <p style="color: #e2e8f0; font-size: 14px; margin-top: 0;">${summary}</p>
      </div>

      <div style="background-color: #ef4444/10; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: rgba(239, 68, 68, 0.05);">
        <strong style="color: #fca5a5; display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; tracking: 1px;">Recommended Action:</strong>
        <span style="color: #f8fafc; font-size: 14px;">${recommendedAction}</span>
      </div>

      <div style="margin-bottom: 25px;">
        <h4 style="color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; font-size: 11px; letter-spacing: 1px;">AI Suggested Reply Draft</h4>
        <div style="background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; color: #cbd5e1; font-size: 13.5px; line-height: 1.5;">
          ${suggestedReply}
        </div>
      </div>

      <div style="border-top: 1px solid #1e293b; padding-top: 15px; text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin-dashboard" style="background-color: #38bdf8; color: #070b16; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
          Go to Manager Dashboard
        </a>
      </div>
    </div>
  `;

  if (isEmailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '2525'),
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: process.env.ALERT_EMAIL_FROM || 'alerts@caremind.ai',
        to: process.env.ALERT_EMAIL_TO || 'manager@caremind.ai',
        subject: emailSubject,
        html: emailHtml
      });

      console.log('✓ [ALERT SERVICE] Email alert dispatched successfully.');
    } catch (err) {
      console.error('✗ [ALERT SERVICE] Email dispatch failed:', err.message);
    }
  } else {
    // Mock Email Alert Logging
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                       MOCK EMAIL SMTP ALERT (NO SMTP CONFIG)                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Subject: ${emailSubject}
║ From: ${process.env.ALERT_EMAIL_FROM || 'alerts@caremind.ai'}
║ To: ${process.env.ALERT_EMAIL_TO || 'manager@caremind.ai'}
║ Details:
║   • Customer: ${customerName} (${email})
║   • Sentiment: ${sentiment} | Churn Risk: ${churnRisk} (Score: ${riskScore}/100)
║   • SLA Target: ${slaHours} Hours | Category: ${category}
║   • Summary: ${summary.slice(0, 120)}${summary.length > 120 ? '...' : ''}
║   • Suggested Reply: ${suggestedReply.slice(0, 120)}${suggestedReply.length > 120 ? '...' : ''}
║   • Recommended Action: ${recommendedAction}
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }
};

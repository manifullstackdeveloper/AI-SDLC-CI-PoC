const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const HTML_REPORT = path.join(__dirname, '../reports/validation-report.html');
const JSON_REPORT = path.join(__dirname, '../reports/validation-report.json');

// Email configuration from environment variables
const config = {
  smtp: {
    host: process.env.SMTP_SERVER || process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USERNAME || process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    },
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    to: process.env.EMAIL_TO || '',
    subject: process.env.EMAIL_SUBJECT || 'Validation Report - SDLC1',
  },
};

function loadReport() {
  try {
    if (fs.existsSync(JSON_REPORT)) {
      return JSON.parse(fs.readFileSync(JSON_REPORT, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading report:', error.message);
  }
  return null;
}

async function sendEmail() {
  if (!config.email.to) {
    console.log('⚠️  EMAIL_TO not set. Skipping email notification.');
    console.log('   Set EMAIL_TO environment variable to enable email notifications.');
    return;
  }

  if (!config.smtp.host || !config.smtp.auth.user) {
    console.log('⚠️  SMTP configuration not set. Skipping email notification.');
    console.log('   Set SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD environment variables.');
    return;
  }

  const report = loadReport();
  if (!report) {
    console.error('❌ No validation report found. Generate report first.');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(config.smtp);

  const statusEmoji = report.overallStatus === 'PASSED' ? '✅' : '❌';
  const statusColor = report.overallStatus === 'PASSED' ? 'green' : 'red';

  let htmlBody = `
    <h2 style="color: ${statusColor};">${statusEmoji} Validation Report: ${report.overallStatus}</h2>
    <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    <p><strong>Violations Found:</strong> ${report.violations.length}</p>
    
    <h3>Validation Results:</h3>
    <ul>
      <li>Linting: <strong>${report.results.linting.status}</strong></li>
      <li>Formatting: <strong>${report.results.formatting.status}</strong></li>
      <li>Tests: <strong>${report.results.tests.status}</strong></li>
      <li>Build: <strong>${report.results.build.status}</strong></li>
      ${report.results.coverage ? `<li>Coverage: <strong>${report.results.coverage.lines.toFixed(1)}%</strong> (${report.results.coverage.status})</li>` : ''}
    </ul>
  `;

  if (report.violations.length > 0) {
    htmlBody += '<h3>🚨 Violations:</h3><ul>';
    report.violations.forEach((v) => {
      htmlBody += `<li><strong>${v.type}:</strong> ${v.details.substring(0, 200)}...</li>`;
    });
    htmlBody += '</ul>';
  }

  htmlBody += `
    <p><strong>Note:</strong> Full HTML report is attached.</p>
    <p>Please review the attached report for detailed information.</p>
  `;

  const attachments = [];
  if (fs.existsSync(HTML_REPORT)) {
    attachments.push({
      filename: 'validation-report.html',
      path: HTML_REPORT,
    });
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: config.email.to,
      subject: `${statusEmoji} ${config.email.subject} - ${report.overallStatus}`,
      html: htmlBody,
      attachments,
    });

    console.log(`✅ Email sent successfully to ${config.email.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  sendEmail();
}

module.exports = { sendEmail };


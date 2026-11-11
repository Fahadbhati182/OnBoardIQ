import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value ?? "Not provided").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendEmployeeWelcomeEmail({ employee, setupUrl }) {
  const { EMAIL_USER: user, EMAIL_PASS: pass } = process.env;
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured");
  }

  const port = Number(process.env.EMAIL_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("EMAIL_PORT must be a valid TCP port");
  }

  const profile = [
    ["Name", employee.name],
    ["Email", employee.email],
    ["Role", employee.role],
    ["Job title", employee.jobTitle],
    ["Department", employee.departmentName],
    ["Team", employee.teamName],
    ["Joining date", employee.joiningDate],
    ["Account active", employee.isActive ? "Yes" : "No"],
    ["Employee ID", employee.id],
  ];
  const rows = profile
    .map(
      ([label, value]) =>
        `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const safeSetupUrl = escapeHtml(setupUrl);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure: process.env.EMAIL_SECURE === "true" || port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: employee.email,
    subject: "Welcome to OnboardIQ — set up your account",
    text: [
      `Hello ${employee.name},`,
      "",
      "Your OnboardIQ employee account has been created.",
      "",
      ...profile.map(([label, value]) => `${label}: ${value ?? "Not provided"}`),
      "",
      "Set your password using this one-time link (expires in 1 hour):",
      setupUrl,
      "",
      "For your security, your password is not included in this email.",
    ].join("\n"),
    html: `
      <p>Hello ${escapeHtml(employee.name)},</p>
      <p>Your OnboardIQ employee account has been created.</p>
      <table cellpadding="8" cellspacing="0" border="1">${rows}</table>
      <p><a href="${safeSetupUrl}">Set your password</a></p>
      <p>This one-time link expires in 1 hour. For your security, your password is not included in this email.</p>
    `,
  });
}

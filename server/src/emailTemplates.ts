const BRAND_INK = "#0a0a0a";
const BRAND_YELLOW = "#f5c400";

function layout(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#faf9f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf9f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_INK};padding:24px 32px;">
                <span style="color:${BRAND_YELLOW};font-size:20px;font-weight:bold;letter-spacing:0.05em;">INOVAÇÃO STORE</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;color:#a3a3a3;font-size:12px;line-height:1.5;">
                  Se você não solicitou este e-mail, pode ignorá-lo com segurança.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationCodeEmail(code: string, minutes: number): { subject: string; html: string } {
  return {
    subject: "Confirme seu e-mail — Inovação Store",
    html: layout(
      "Confirme seu e-mail",
      `
        <h1 style="margin:0 0 12px;font-size:20px;color:${BRAND_INK};">Confirme seu e-mail</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#404040;">
          Use o código abaixo para confirmar seu e-mail e concluir seu cadastro na Inovação Store.
        </p>
        <div style="margin:0 0 24px;padding:16px;background-color:#faf9f5;border-radius:12px;text-align:center;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:0.3em;color:${BRAND_INK};">${code}</span>
        </div>
        <p style="margin:0;font-size:13px;color:#737373;">
          Seu código de verificação é: <strong>${code}</strong><br />
          O código expira em ${minutes} minutos.
        </p>
      `,
    ),
  };
}

export function passwordResetEmail(link: string, minutes: number): { subject: string; html: string } {
  return {
    subject: "Redefinir sua senha — Inovação Store",
    html: layout(
      "Redefinir sua senha",
      `
        <h1 style="margin:0 0 12px;font-size:20px;color:${BRAND_INK};">Redefinir sua senha</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#404040;">
          Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para
          escolher uma nova senha.
        </p>
        <div style="margin:0 0 24px;text-align:center;">
          <a href="${link}" style="display:inline-block;padding:14px 28px;background-color:${BRAND_YELLOW};color:${BRAND_INK};font-weight:bold;text-decoration:none;border-radius:999px;font-size:14px;">
            Redefinir senha
          </a>
        </div>
        <p style="margin:0 0 12px;font-size:13px;color:#737373;">
          Ou copie e cole este link no navegador:<br />
          <a href="${link}" style="color:#404040;word-break:break-all;">${link}</a>
        </p>
        <p style="margin:0;font-size:13px;color:#737373;">
          Este link expira em ${minutes} minutos.
        </p>
      `,
    ),
  };
}

import { Resend } from "resend";
import { ENV } from "./env";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(ENV.resendApiKey || process.env.RESEND_API_KEY);
  return _resend;
}

// Use verified domain when available, otherwise fallback to resend.dev sandbox
const FROM_EMAIL = "onboarding@resend.dev";
const FROM_NAME = "Larf Menu";

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Redefinição de senha — Larf Menu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #c0392b;">Larf Menu</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">Redefinição de senha</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Olá, <strong>${name}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha:
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="display: inline-block; background: #c0392b; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Redefinir senha
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.6;">
          Este link é válido por <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">Larf Menu — Cardápio Digital para Restaurantes</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendWelcomeEmail({
  to,
  name,
  setPasswordUrl,
  companyName,
}: {
  to: string;
  name: string;
  setPasswordUrl: string;
  companyName?: string;
}) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Bem-vindo ao Larf Menu — Defina sua senha",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #c0392b;">Larf Menu</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">Bem-vindo, ${name}! 👋</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Sua conta foi criada no Larf Menu${companyName ? ` para o restaurante <strong>${companyName}</strong>` : ""}.
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Para acessar o painel do seu cardápio, defina sua senha clicando no botão abaixo:
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${setPasswordUrl}" style="display: inline-block; background: #c0392b; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Definir minha senha
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.6;">
          Este link é válido por <strong>24 horas</strong>. Após definir a senha, acesse sempre em
          <a href="https://larfmenu.com.br/login" style="color: #c0392b;">larfmenu.com.br/login</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">Larf Menu — Cardápio Digital para Restaurantes</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendApprovalEmail({ to, name }: { to: string; name: string }) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Sua conta foi aprovada — Larf Menu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #c0392b;">Larf Menu</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">Conta aprovada! 🎉</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Olá, <strong>${name}</strong>! Sua solicitação de acesso foi aprovada.
          Você já pode entrar no painel do Larf Menu com seu e-mail e senha.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="https://larfmenu.com.br/login" style="display: inline-block; background: #c0392b; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Acessar o painel
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">Larf Menu — Cardápio Digital para Restaurantes</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: "Confirme seu e-mail — Larf Menu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #c0392b;">Larf Menu</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">Olá, ${name}! 👋</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Obrigado por criar sua conta no <strong>Larf Menu</strong>!
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Clique no botão abaixo para confirmar seu e-mail e ativar sua conta automaticamente:
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" style="display: inline-block; background: #c0392b; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Confirmar e-mail
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.6;">
          Link válido por <strong>24 horas</strong>. Se você não criou esta conta, ignore este e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">Larf Menu — Cardápio Digital para Restaurantes</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendMemberInviteEmail({
  to,
  name,
  companyName,
  invitedByName,
  setPasswordUrl,
}: {
  to: string;
  name: string;
  companyName: string;
  invitedByName: string;
  setPasswordUrl: string;
}) {
  const { error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Você foi convidado para gerenciar ${companyName} no Larf Menu`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #c0392b;">Larf Menu</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">Você foi convidado! 🎉</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Olá, <strong>${name}</strong>!
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          <strong>${invitedByName}</strong> convidou você para gerenciar o cardápio digital do restaurante
          <strong>${companyName}</strong> no Larf Menu.
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Para acessar o painel, clique no botão abaixo e defina sua senha:
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${setPasswordUrl}" style="display: inline-block; background: #c0392b; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Definir senha e acessar
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.6;">
          Este link é válido por <strong>48 horas</strong>. Após definir a senha, acesse sempre em
          <a href="https://larfmenu.com.br/login" style="color: #c0392b;">larfmenu.com.br/login</a>.
        </p>
        <p style="color: #aaa; font-size: 12px; line-height: 1.6; margin-top: 8px;">
          Se você não esperava este convite, pode ignorar este e-mail com segurança.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">Larf Menu — Cardápio Digital para Restaurantes</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

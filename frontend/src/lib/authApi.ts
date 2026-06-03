import { authHeaders as buildHeaders, setAuth, type AuthUser } from "@/lib/authStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiBody = {
  success?: boolean;
  message?: string;
  data?: unknown;
  detail?: string | { message?: string };
};

async function parseMessage(res: Response, body: ApiBody): Promise<string> {
  if (body.message) return body.message;
  if (typeof body.detail === "string") return body.detail;
  if (body.detail && typeof body.detail === "object" && body.detail.message) {
    return body.detail.message;
  }
  return `Request failed (${res.status})`;
}

async function authRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}/api/auth${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  });
  const body = (await res.json().catch(() => ({}))) as ApiBody & T;
  if (!res.ok) {
    throw new Error(await parseMessage(res, body));
  }
  return body as T;
}

export async function getCaptcha(): Promise<{ token: string; question: string }> {
  const res = await authRequest<{ success: boolean; data: { token: string; question: string } }>(
    "/captcha",
  );
  return res.data;
}

export async function requestLoginOtp(payload: {
  email: string;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<string> {
  const res = await authRequest<{ success: boolean; message: string }>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.message || "OTP sent to your email.";
}

export async function verifyLoginOtp(email: string, otp: string): Promise<{ token: string; user: AuthUser }> {
  const res = await authRequest<{
    success: boolean;
    data: { token: string; user: AuthUser };
  }>("/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  setAuth(res.data.token, res.data.user);
  return res.data;
}

export async function resendLoginOtp(email: string): Promise<string> {
  const res = await authRequest<{ success: boolean; message: string }>("/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email, purpose: "login" }),
  });
  return res.message || "A new OTP has been sent.";
}

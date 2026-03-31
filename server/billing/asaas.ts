const ASAAS_BASE =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

async function asaasReq(method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": process.env.ASAAS_API_KEY ?? "",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description ?? "Asaas error";
    throw new Error(`[Asaas ${res.status}] ${msg}`);
  }
  return data;
}

export async function upsertAsaasCustomer(user: {
  id: number;
  name: string | null;
  email: string | null;
  cpfCnpj?: string;
  phone?: string;
}): Promise<{ id: string }> {
  if (user.cpfCnpj) {
    const existing = await asaasReq("GET", `/customers?cpfCnpj=${user.cpfCnpj}`);
    if (existing.totalCount > 0) return existing.data[0] as { id: string };
  }
  return asaasReq("POST", "/customers", {
    name: user.name ?? user.email ?? `User #${user.id}`,
    email: user.email,
    cpfCnpj: user.cpfCnpj,
    phone: user.phone,
    externalReference: String(user.id),
    notificationDisabled: false,
  });
}

export async function createAsaasSubscription(opts: {
  customerId: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  valueReais: number;
  nextDueDate: string;
  description: string;
  externalRef: string;
}): Promise<{ id: string }> {
  return asaasReq("POST", "/subscriptions", {
    customer: opts.customerId,
    billingType: opts.billingType,
    value: opts.valueReais,
    nextDueDate: opts.nextDueDate,
    cycle: "MONTHLY",
    description: opts.description,
    externalReference: opts.externalRef,
    fine: { value: 2 },
    interest: { value: 1 },
  });
}

export async function cancelAsaasSubscription(asaasSubId: string): Promise<void> {
  await asaasReq("DELETE", `/subscriptions/${asaasSubId}`);
}

export async function createPixPayment(opts: {
  customerId: string;
  valueReais: number;
  description: string;
  daysToExpire?: number;
}): Promise<{ paymentId: string; encodedImage: string; payload: string }> {
  const dueDate = new Date(Date.now() + (opts.daysToExpire ?? 3) * 86400000)
    .toISOString()
    .split("T")[0]!;
  const payment = await asaasReq("POST", "/payments", {
    customer: opts.customerId,
    billingType: "PIX",
    value: opts.valueReais,
    dueDate,
    description: opts.description,
  });
  const qr = await asaasReq("GET", `/payments/${payment.id}/pixQrCode`);
  return { paymentId: payment.id as string, encodedImage: qr.encodedImage as string, payload: qr.payload as string };
}

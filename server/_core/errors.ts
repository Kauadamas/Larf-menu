import { TRPCError } from "@trpc/server";

/**
 * Maps internal errors to user-friendly messages.
 * Always logs the real error to the console, never exposes it to the client.
 */
export function handleServerError(err: unknown, context: string): never {
  const realMessage = err instanceof Error ? err.message : String(err);
  console.error(`[${context}]`, realMessage, err);

  // Map known DB/infra errors to friendly messages
  if (realMessage.includes("ER_DUP_ENTRY") || realMessage.includes("Duplicate entry")) {
    throw new TRPCError({ code: "CONFLICT", message: "Este registro já existe. Verifique os dados e tente novamente." });
  }
  if (realMessage.includes("ER_NO_REFERENCED_ROW") || realMessage.includes("foreign key")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Referência inválida. O item relacionado não existe." });
  }
  if (realMessage.includes("ECONNREFUSED") || realMessage.includes("DB not available") || realMessage.includes("getaddrinfo")) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Serviço temporariamente indisponível. Tente novamente em alguns instantes." });
  }
  if (realMessage.includes("ETIMEDOUT") || realMessage.includes("timeout")) {
    throw new TRPCError({ code: "TIMEOUT", message: "A operação demorou muito. Verifique sua conexão e tente novamente." });
  }
  if (realMessage.includes("JSON")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Dados inválidos recebidos. Recarregue a página e tente novamente." });
  }

  // Generic fallback — never expose real error to client
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro inesperado. Nossa equipe foi notificada." });
}

/**
 * Wraps an async operation with friendly error handling.
 */
export async function withErrorHandling<T>(context: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof TRPCError) throw err; // already handled, re-throw as-is
    handleServerError(err, context);
  }
}

import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

// ─── User-friendly messages for known error codes ─────────────────────────────
const USER_FRIENDLY: Record<string, string> = {
  INTERNAL_SERVER_ERROR: "Ocorreu um erro inesperado. Tente novamente em alguns instantes.",
  TIMEOUT: "A operação demorou muito. Verifique sua conexão e tente novamente.",
  TOO_MANY_REQUESTS: "Muitas tentativas. Aguarde um momento antes de tentar novamente.",
  UNAUTHORIZED: "Você precisa estar autenticado para realizar esta ação.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "O item solicitado não foi encontrado.",
  CONFLICT: "Este registro já existe ou está em conflito com outro.",
  BAD_REQUEST: "Dados inválidos. Verifique as informações e tente novamente.",
  METHOD_NOT_SUPPORTED: "Operação não suportada.",
  PRECONDITION_FAILED: "Pré-condição não atendida. Verifique os dados.",
  UNPROCESSABLE_CONTENT: "Não foi possível processar os dados enviados.",
  PARSE_ERROR: "Erro ao processar os dados. Recarregue a página.",
};

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isTRPCError = error instanceof TRPCError;
    const isInternal = !isTRPCError || error.code === "INTERNAL_SERVER_ERROR";

    // Always log real errors server-side
    if (isInternal) {
      console.error("[tRPC Error]", error.code, error.message, error.cause ?? "");
    }

    // Determine what message to show the client
    const code = shape.data?.code ?? "INTERNAL_SERVER_ERROR";
    const hasCustomMessage = isTRPCError && error.message &&
      !error.message.toLowerCase().includes("error") &&
      error.message !== error.code;

    const clientMessage = isInternal
      ? USER_FRIENDLY["INTERNAL_SERVER_ERROR"]
      : (hasCustomMessage ? error.message : (USER_FRIENDLY[code] ?? error.message));

    return {
      ...shape,
      message: clientMessage,
      data: {
        ...shape.data,
        // Never send stack traces or internal details to client
        stack: undefined,
        path: shape.data?.path,
        code: shape.data?.code,
        httpStatus: shape.data?.httpStatus,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

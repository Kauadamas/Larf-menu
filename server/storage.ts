// Storage via base64 data URL — sem dependência de serviço externo
// A URL retornada é uma data URL que pode ser salva direto no banco

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const base64 = Buffer.isBuffer(data)
    ? data.toString("base64")
    : data instanceof Uint8Array
    ? Buffer.from(data).toString("base64")
    : Buffer.from(data as string, "binary").toString("base64");
  const url = `data:${contentType};base64,${base64}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  // Com data URLs, a URL já está salva no banco — não precisa buscar em lugar nenhum
  return { key: relKey, url: "" };
}

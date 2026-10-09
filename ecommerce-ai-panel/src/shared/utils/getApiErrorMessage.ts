function formatValidationItem(item: unknown): string | null {
  if (typeof item === "string" && item.trim()) {
    return item;
  }
  if (!item || typeof item !== "object") {
    return null;
  }
  const o = item as { msg?: unknown; loc?: unknown };
  if (typeof o.msg !== "string" || !o.msg.trim()) {
    return null;
  }
  if (Array.isArray(o.loc) && o.loc.length > 0) {
    const field = String(o.loc[o.loc.length - 1]);
    return `${field}: ${o.msg}`;
  }
  return o.msg;
}

/** FastAPI `detail` (string veya validation dizisi) → okunabilir metin */
export function parseApiDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map(formatValidationItem)
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }
  return null;
}

type AxiosLikeError = {
  response?: { data?: { detail?: unknown; message?: unknown } };
};

function detailFromAxios(err: unknown): string | null {
  if (!err || typeof err !== "object" || !("response" in err)) {
    return null;
  }
  const data = (err as AxiosLikeError).response?.data;
  return (
    parseApiDetail(data?.detail) ??
    (typeof data?.message === "string" ? data.message : null)
  );
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const fromAxios = detailFromAxios(err);
  if (fromAxios) {
    return fromAxios;
  }

  if (err && typeof err === "object") {
    const normalized = err as { message?: unknown; raw?: unknown };
    const fromMessage = parseApiDetail(normalized.message);
    if (fromMessage) {
      return fromMessage;
    }
    const fromRaw = detailFromAxios(normalized.raw);
    if (fromRaw) {
      return fromRaw;
    }
  }

  if (err instanceof Error && err.message.trim()) {
    const fromErrorMessage = parseApiDetail(err.message);
    if (fromErrorMessage) {
      return fromErrorMessage;
    }
    if (!err.message.startsWith("[object")) {
      return err.message;
    }
  }

  return fallback;
}

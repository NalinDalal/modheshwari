type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const envPretty = String(process.env.LOG_PRETTY || "false").toLowerCase() === "true";
const envLevel = (process.env.LOG_LEVEL || "DEBUG").toUpperCase() as LogLevel;
const minLevel = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.DEBUG;

const COLORS: Record<LogLevel, string> = {
  DEBUG: "\u001b[36m", // cyan
  INFO: "\u001b[32m", // green
  WARN: "\u001b[33m", // yellow
  ERROR: "\u001b[31m", // red
};
const RESET = "\u001b[0m";

function safeStringify(v: unknown) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch (_) {
    return String(v);
  }
}

function formatJSON(level: LogLevel, msg: unknown, meta?: unknown) {
  const ts = new Date().toISOString();
  const base: Record<string, unknown> = { timestamp: ts, service: "ws", level };
  if (meta instanceof Error) {
    return JSON.stringify({ ...base, message: String(msg), error: { message: meta.message, stack: meta.stack } });
  }
  if (typeof msg === "object") {
    return JSON.stringify({ ...base, ...(msg as Record<string, unknown>), meta });
  }
  return JSON.stringify({ ...base, message: String(msg), meta });
}

function formatPretty(level: LogLevel, msg: unknown, meta?: unknown) {
  const ts = new Date().toISOString();
  const color = COLORS[level] || "";
  const header = `${color}${level}${RESET}`;
  const message = typeof msg === "string" ? msg : safeStringify(msg);
  let metaStr = "";
  if (meta instanceof Error) {
    metaStr = `\n${meta.stack || meta.message}`;
  } else if (meta !== undefined) {
    try {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    } catch (_) {
      metaStr = `\n${String(meta)}`;
    }
  }
  return `[${ts}] ${header} — ${message}${metaStr}`;
}

function shouldLog(level: LogLevel) {
  return (LEVEL_ORDER[level] ?? 0) >= minLevel;
}

function write(level: LogLevel, msg: unknown, meta?: unknown) {
  if (!shouldLog(level)) return;
  const out = envPretty ? formatPretty(level, msg, meta) : formatJSON(level, msg, meta);
  switch (level) {
    case "DEBUG":
      console.debug(out);
      break;
    case "INFO":
      console.log(out);
      break;
    case "WARN":
      console.warn(out);
      break;
    case "ERROR":
      console.error(out);
      break;
  }
}

export const logger = {
  debug: (msg: unknown, meta?: unknown) => write("DEBUG", msg, meta),
  info: (msg: unknown, meta?: unknown) => write("INFO", msg, meta),
  warn: (msg: unknown, meta?: unknown) => write("WARN", msg, meta),
  error: (msg: unknown, meta?: unknown) => write("ERROR", msg, meta),
};

export default logger;

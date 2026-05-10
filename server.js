const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = process.env.PORT || 4321;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large."));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const normalizeContactPayload = (payload = {}) => ({
  firstName: String(payload.firstName || "").trim(),
  lastName: String(payload.lastName || "").trim(),
  businessEmail: String(payload.businessEmail || "").trim(),
  phoneNumber: String(payload.phoneNumber || "").trim(),
  jobTitle: String(payload.jobTitle || "").trim(),
  company: String(payload.company || "").trim(),
  inquiryType: String(payload.inquiryType || "").trim(),
  message: String(payload.message || "").trim(),
  source: String(payload.source || "homepage-side-sheet").trim(),
  website: String(payload.website || "").trim(),
});

const validateContactPayload = (payload) => {
  if (payload.website) {
    return "Spam submission rejected.";
  }

  if (!payload.firstName || !payload.lastName) {
    return "First name and last name are required.";
  }

  if (!payload.businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.businessEmail)) {
    return "A valid business email is required.";
  }

  if (!payload.company) {
    return "Company is required.";
  }

  if (!payload.inquiryType) {
    return "Inquiry type is required.";
  }

  if (!payload.message) {
    return "Message is required.";
  }

  return "";
};

const persistContactSubmission = async (payload) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseTable = process.env.SUPABASE_CONTACT_TABLE || "contact_submissions";
  const googleSheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Contact endpoint is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const record = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    business_email: payload.businessEmail,
    phone_number: payload.phoneNumber || null,
    job_title: payload.jobTitle || null,
    company: payload.company,
    inquiry_type: payload.inquiryType,
    message: payload.message,
    source: payload.source,
    submitted_at: new Date().toISOString(),
  };

  const supabaseResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${supabaseTable}`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([record]),
  });

  if (!supabaseResponse.ok) {
    const errorText = await supabaseResponse.text();
    throw new Error(errorText || "Supabase rejected the contact submission.");
  }

  if (googleSheetsWebhookUrl) {
    const googleResponse = await fetch(googleSheetsWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      throw new Error(errorText || "Google Sheets mirror failed.");
    }
  }
};

const handleContactSubmission = async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end("Method Not Allowed");
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const contentType = req.headers["content-type"] || "";

    let parsedBody = {};
    if (contentType.includes("application/json")) {
      parsedBody = rawBody ? JSON.parse(rawBody) : {};
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      parsedBody = Object.fromEntries(new URLSearchParams(rawBody).entries());
    } else {
      throw new Error("Unsupported content type.");
    }

    const payload = normalizeContactPayload(parsedBody);
    const validationError = validateContactPayload(payload);

    if (validationError) {
      sendJson(res, 400, {
        ok: false,
        message: validationError,
      });
      return;
    }

    await persistContactSubmission(payload);

    sendJson(res, 200, {
      ok: true,
      message: "Inquiry received.",
    });
  } catch (error) {
    const message = error?.message || "Unable to process the contact request.";
    const statusCode =
      message.includes("configured") ? 503 : message.includes("Unsupported content type") ? 415 : 500;

    sendJson(res, statusCode, {
      ok: false,
      message,
    });
  }
};

const serveStaticFile = (requestPath, res) => {
  const filePath = path.resolve(root, `.${requestPath}`);
  const rootPath = `${root}${path.sep}`;

  if (filePath !== root && !filePath.startsWith(rootPath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(error.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".mp4" ? "public, max-age=3600" : "no-cache",
    });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  let requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;

  if (requestPath === "/events" || requestPath === "/events/") {
    requestPath = "/events.html";
  }

  if (requestPath === "/api/contact") {
    await handleContactSubmission(req, res);
    return;
  }

  serveStaticFile(requestPath, res);
});

server.listen(port, () => {
  console.log(`Light Ventures preview running at http://localhost:${port}`);
});

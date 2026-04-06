function getPublicApiBase(req) {
  const configuredBase = String(process.env.PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (configuredBase) return configuredBase;
  if (!req) return "";

  const base = `${req.protocol}://${req.get("host")}`;
  return base.replace(/\/+$/, "");
}

function normalizeImageName(name) {
  return String(name || "image")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

function createImageDocument(file) {
  if (!file?.buffer) return null;

  return {
    data: file.buffer,
    contentType: String(file.mimetype || "application/octet-stream"),
    filename: normalizeImageName(file.originalname)
  };
}

function buildImageUrl(req, entity, id, field) {
  if (!entity || !id || !field) return "";
  return `/api/images/${entity}/${id}/${field}`;
}

function setStoredImage(doc, fieldName, file, req, entity) {
  if (!doc || !fieldName || !entity) return "";

  const imageDocument = createImageDocument(file);
  if (!imageDocument) return "";

  doc[`${fieldName}Image`] = imageDocument;
  doc[`${fieldName}Url`] = buildImageUrl(req, entity, doc._id, fieldName);
  return doc[`${fieldName}Url`];
}

function setImageFromBodyValue(doc, fieldName, value) {
  if (!doc || !fieldName || value === undefined) return;

  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    doc[`${fieldName}Image`] = undefined;
    doc[`${fieldName}Url`] = "";
    return;
  }

  doc[`${fieldName}Image`] = undefined;
  doc[`${fieldName}Url`] = normalizedValue;
}

function getResolvedImageUrl(doc, fieldName, req, entity) {
  if (!doc || !fieldName) return "";

  const image = doc[`${fieldName}Image`];
  if (image?.contentType) {
    return buildImageUrl(req, entity, doc._id || doc.id, fieldName);
  }

  return String(doc[`${fieldName}Url`] || "").trim();
}

module.exports = {
  buildImageUrl,
  setStoredImage,
  setImageFromBodyValue,
  getResolvedImageUrl
};

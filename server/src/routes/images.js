const express = require("express");

const User = require("../models/User");
const Event = require("../models/Event");

const router = express.Router();

const modelMap = {
  users: User,
  events: Event
};

const fieldMap = {
  users: new Set(["photo", "paymentQr"]),
  events: new Set(["poster", "paymentQr"])
};

function toNodeBuffer(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value.buffer && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (value.buffer && value.position !== undefined) {
    return Buffer.from(value.buffer);
  }
  if (Array.isArray(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return null;
}

router.get("/:entity/:id/:field", async (req, res) => {
  try {
    const { entity, id, field } = req.params;
    const Model = modelMap[entity];
    if (!Model || !fieldMap[entity]?.has(field)) {
      return res.status(404).json({ error: "Image not found." });
    }

    const imageField = `${field}Image`;
    const document = await Model.findById(id).select({ [imageField]: 1 });
    const image = document?.[imageField];
    const imageBuffer = toNodeBuffer(image?.data);

    if (!imageBuffer || !image?.contentType) {
      return res.status(404).json({ error: "Image not found." });
    }

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(imageBuffer);
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load image." });
  }
});

module.exports = router;

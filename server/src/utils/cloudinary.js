const { v2: cloudinary } = require("cloudinary");
const { fileToPublicUrl, saveFileLocally } = require("./upload");

const cloudinaryUrl = String(process.env.CLOUDINARY_URL || "").trim();

if (cloudinaryUrl) {
  cloudinary.config({ secure: true });
}

function uploadBufferToCloudinary(file, folder) {
  if (!file) return Promise.resolve("");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result?.secure_url || "");
      }
    );

    stream.end(file.buffer);
  });
}

async function uploadImage(file, folder, req) {
  if (!file) return "";

  const localFilename = saveFileLocally(file);
  const localUrl = fileToPublicUrl(req, localFilename);

  if (!cloudinaryUrl) {
    return localUrl;
  }

  try {
    const cloudinaryUrlResult = await uploadBufferToCloudinary(file, folder);
    return cloudinaryUrlResult || localUrl;
  } catch (_error) {
    return localUrl;
  }
}

module.exports = { uploadImage };

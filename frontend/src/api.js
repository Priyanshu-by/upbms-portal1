export function authHeaders(session) {
  const headers = {};
  if (session?.adminPin) headers["X-Admin-Pin"] = session.adminPin;
  else if (session?.memberId && session?.memberPass) {
    headers["X-Member-Id"] = session.memberId;
    headers["X-Member-Pass"] = encodeURIComponent(session.memberPass);
  }
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  return headers;
}

export async function api(path, { method = "GET", body, session, raw } = {}) {
  const headers = { ...authHeaders(session) };
  const opts = { method, headers, credentials: "include" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Automatically compress and downscale high-resolution images on the client
 * to make uploads instantaneous and reduce web/mobile bandwidth.
 */
export async function compressImageClient(file, { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = {}) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }
  // Skip if already small
  if (file.size <= 300 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxWidth && height <= maxHeight && file.size <= 600 * 1024) {
        return resolve(file);
      }
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const ext = file.type === "image/png" ? ".png" : ".webp";
            const mimeType = file.type === "image/png" ? "image/png" : "image/webp";
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ext), {
              type: mimeType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type === "image/png" ? "image/png" : "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Optimizes a Cloudinary URL to deliver compressed, responsive formats (WebP/AVIF)
 * @param {string} url - Image URL
 * @param {Object} options - { width, quality, format }
 */
export function optimizeImageUrl(url, { width = 1600, quality = "auto", format = "auto" } = {}) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }
  if (url.includes("/f_auto") || url.includes("/q_auto")) {
    return url;
  }
  const match = url.match(/(https?:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(.*)/);
  if (!match) return url;
  const prefix = match[1];
  const rest = match[2];
  const transforms = [];
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width},c_limit`);
  return `${prefix}${transforms.join(",")}/${rest}`;
}

/**
 * Centralized Cloudinary Upload Service for Frontend
 * Uploads directly via multipart/form-data to /api/upload
 * Returns full asset details { url, secure_url, public_id, size, format }
 */
export async function uploadMedia(file, session, { folder = "upbms/general", autoCompress = true } = {}) {
  let fileToUpload = file;
  if (autoCompress && file && file.type?.startsWith("image/")) {
    try {
      fileToUpload = await compressImageClient(file, {
        maxWidth: folder.includes("slides") ? 1920 : 1600,
        maxHeight: folder.includes("slides") ? 1080 : 1600,
        quality: 0.85
      });
    } catch {
      fileToUpload = file;
    }
  }

  const headers = { ...authHeaders(session) };
  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers, // Do NOT set Content-Type; browser sets multipart/form-data with boundary
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data;
}

/**
 * Standard upload function returning the Cloudinary secure URL string
 * Fully backwards-compatible with all existing components
 */
export async function uploadFile(file, session, options = {}) {
  const data = await uploadMedia(file, session, options);
  return data.secure_url || data.url;
}

/**
 * Admin utility to delete an asset from Cloudinary
 */
export async function deleteMedia(publicId, session) {
  if (!publicId) return { ok: true };
  return api("/api/upload/delete", {
    method: "POST",
    session,
    body: { public_id: publicId }
  });
}

import { AVATAR_BUCKET, AVATAR_MAX_BYTES } from '../config/constants.js';
import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sniffImageType } from '../utils/imageType.js';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** The bucket is created by the migration; this covers projects that skipped it. */
async function ensureBucket() {
  const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: AVATAR_MAX_BYTES,
    allowedMimeTypes: Object.keys(EXTENSIONS),
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new ApiError(500, `Could not create the avatars bucket: ${error.message}`);
  }
}

async function listUserFiles(userId) {
  const { data } = await supabase.storage.from(AVATAR_BUCKET).list(userId, { limit: 100 });
  return (data ?? []).map((f) => `${userId}/${f.name}`);
}

/** Uploads a new photo, removes the old ones, returns the public URL. */
export async function storeAvatar(userId, buffer) {
  if (!buffer?.length) throw ApiError.badRequest('Choose a photo to upload');
  if (buffer.length > AVATAR_MAX_BYTES) throw ApiError.badRequest('Photo must be 2 MB or smaller');
  const type = sniffImageType(buffer);
  if (!type) throw ApiError.badRequest('Use a JPEG, PNG or WebP image');

  const oldFiles = await listUserFiles(userId);
  // A new file name each time, so browsers and CDNs never show a stale photo.
  const path = `${userId}/${Date.now()}.${EXTENSIONS[type]}`;
  const upload = () =>
    supabase.storage.from(AVATAR_BUCKET).upload(path, buffer, { contentType: type, cacheControl: '31536000', upsert: false });

  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    await ensureBucket();
    ({ error } = await upload());
  }
  if (error) throw new ApiError(500, `Could not save your photo: ${error.message}`);

  if (oldFiles.length) await supabase.storage.from(AVATAR_BUCKET).remove(oldFiles);
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeAvatar(userId) {
  const files = await listUserFiles(userId);
  if (files.length) await supabase.storage.from(AVATAR_BUCKET).remove(files);
}

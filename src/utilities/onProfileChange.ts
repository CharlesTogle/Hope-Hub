import supabase from '@/client/supabase';
import { logger } from '@/utilities/logger';
import { getUserFacingError } from '@/utilities/user-facing-errors';

const IMAGE_MAGIC_BYTES: Record<string, Uint8Array> = {
  'image/jpeg': new Uint8Array([0xFF, 0xD8, 0xFF]),
  'image/png': new Uint8Array([0x89, 0x50, 0x4E, 0x47]),
  'image/gif': new Uint8Array([0x47, 0x49, 0x46, 0x38]),
  'image/webp': new Uint8Array([0x52, 0x49, 0x46, 0x46]),
};

function isValidImageType(mime: string): mime is keyof typeof IMAGE_MAGIC_BYTES {
  return mime in IMAGE_MAGIC_BYTES;
}

async function readMagicBytes(file: File, byteCount: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, byteCount).arrayBuffer());
}

function magicMatches(signature: Uint8Array, fileHeader: Uint8Array): boolean {
  if (signature.length > fileHeader.length) return false;
  return signature.every((byte, i) => byte === fileHeader[i]);
}

export async function onProfileChange(
  userID: string | null,
  file: File,
  fileName = 'profilePicture',
) {
  if (!userID) return { success: false, error: 'User not found' };

  if (!isValidImageType(file.type)) {
    return { success: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }

  const header = await readMagicBytes(file, 4);
  if (!magicMatches(IMAGE_MAGIC_BYTES[file.type], header)) {
    return { success: false, error: 'File content does not match the declared image type' };
  }

  const bucketName = 'profile-pictures';
  const folderName = userID;
  const filePath = `${folderName}/${fileName}`;
  const supabaseClient = supabase;

  await supabaseClient.storage.from(bucketName).remove([filePath]);

  const { error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (error) {
    logger.error('onProfileChange upload failed', error, { userID, filePath });
    return { success: false, error: getUserFacingError(error, 'profile-upload') };
  }

  return { success: true };
}

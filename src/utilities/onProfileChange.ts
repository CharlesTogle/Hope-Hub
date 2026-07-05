import supabase from '@/client/supabase';

export async function onProfileChange(
  userID: string | null,
  file: File,
  fileName = 'profilePicture',
) {
  if (!userID) return { success: false, error: 'User not found' };
  const bucketName = 'profile-pictures';
  const folderName = userID;
  const filePath = `${folderName}/${fileName}`;
  const supabaseClient = supabase;

  await supabaseClient.storage.from(bucketName).remove([filePath]);

  const { error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (error) {
    console.error('onProfileChange upload failed', { userID, filePath, error });
    return { success: false, error: error.message };
  }

  return { success: true };
}

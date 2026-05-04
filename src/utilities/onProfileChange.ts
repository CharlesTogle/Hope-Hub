import supabase from '@/client/supabase';

export async function onProfileChange(
  userID: string | null,
  file: File,
  fileName = 'profilePicture',
) {
  if (!userID) return;
  const bucketName = 'profile-pictures';
  const folderName = userID;
  const filePath = `${folderName}/${fileName}`;
  const supabaseClient = supabase;

  // Delete existing file first
  await supabaseClient.storage.from(bucketName).remove([filePath]);

  // Then upload new one
  const { error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (error) {
    console.error('onProfileChange upload failed', { userID, filePath, error });
  }
}

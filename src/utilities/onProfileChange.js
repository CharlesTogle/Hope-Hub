import supabase from '@/client/supabase';

export async function onProfileChange (
  userID,
  file,
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
  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (error) {
  } else {
  }
}

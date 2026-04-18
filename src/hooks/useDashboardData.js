import { useState, useEffect } from 'react';
import supabase from '@/client/supabase';

export function useName (userID, isDataReady) {
  const [studentName, setStudentName] = useState('');
  useEffect(() => {
    async function fetchStudentName () {
      if (!userID) {
        setStudentName('');
        return;
      }
      const { data, error } = await supabase
        .from('profile')
        .select('full_name')
        .eq('uuid', userID)
        .single();
      if (error || !data) {
        setStudentName('');
      } else {
        setStudentName(data.full_name || '');
      }
    }
    fetchStudentName();
  }, [userID]);
  return studentName;
}

export function useProfilePicture (userID, isDataReady) {
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  useEffect(() => {
    async function retrieveProfile () {
      if (!userID || typeof userID !== 'string') {
        setProfilePictureFile(null);
        return;
      }
      const folder = userID;
      const fileName = 'profilePicture';
      const { data: files, error: listError } = await supabase.storage
        .from('profile-pictures')
        .list(folder);

      if (listError) {
        setProfilePictureFile(null);
        return;
      }

      const fileExists = files?.some(file => file.name === fileName);

      if (!fileExists) {
        setProfilePictureFile(null);
        return;
      }

      const filePath = `${folder}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .download(filePath);

      if (error || !data) {
        setProfilePictureFile(null);
        return;
      }
      setProfilePictureFile(data);
    }

    retrieveProfile();
  }, [userID]);

  return [profilePictureFile, setProfilePictureFile];
}

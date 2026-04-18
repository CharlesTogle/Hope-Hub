// hooks/useUserId.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/client/supabase';

export const useUserId = () => {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        navigate('/auth/login');
        return;
      }
      setUserId(data.session.user.id);
    };

    getSession();
  }, [navigate]);

  return userId; // ✅ returns the actual user ID string, not a Promise
};

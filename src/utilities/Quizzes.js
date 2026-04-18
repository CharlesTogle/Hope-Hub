import supabase from '@/client/supabase';

export const Quizzes = async () => {
  const { data, error } = await supabase.from('quiz').select('quiz_number');
  if (error) {
    return [];
  } else {
    return data;
  }
};

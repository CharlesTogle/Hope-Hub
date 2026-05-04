export type UserType = 'admin' | 'student' | 'teacher';

export interface Profile {
  uuid: string;
  user_type: UserType;
  full_name: string;
  email: string;
}

export type UserType = 'student' | 'teacher';

export interface Profile {
  uuid: string;
  user_type: UserType;
  full_name: string;
  email: string;
}

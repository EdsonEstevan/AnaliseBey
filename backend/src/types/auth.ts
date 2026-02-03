import { UserRole, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  battleMilestone: number;
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

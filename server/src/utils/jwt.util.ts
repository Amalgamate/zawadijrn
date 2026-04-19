import * as jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { Role } from '../config/permissions';

type InstitutionType = 'PRIMARY_CBC' | 'SECONDARY' | 'TERTIARY';

interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  institutionType: InstitutionType;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  institutionType?: InstitutionType | null;
}

export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    institutionType: (user.institutionType || 'PRIMARY_CBC') as InstitutionType,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
};

export const generateRefreshToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};

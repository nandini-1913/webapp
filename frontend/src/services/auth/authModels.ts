/** Mirrors Flutter `features/auth/domain/models/auth_models.dart`. */

export type UserRole = 'dealer' | 'builder' | 'contractor' | 'individualCustomer';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  businessName?: string | null;
  role?: UserRole | null;
  isGuest?: boolean;
  referralCode?: string | null;
}

-- Session 60: add the self-service change-password flow's own rate-limit bucket.
ALTER TYPE "AdminLoginAttemptKind" ADD VALUE 'change_password_confirm';

INSERT INTO "user" (email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  'admin@zawadijunioracademy.co.ke',
  '$2a$10$P.gWdFVLw7H7bQZJ8H5y6OQhUx8XJ9k2nLv0n5Z3w5K9mM2L0q5Be',
  'Admin',
  'User',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);

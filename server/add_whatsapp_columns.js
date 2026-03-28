const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking and adding WhatsApp columns manually to bypass Prisma DB Push drift...");
    
    // Attempt column additions (ignore if they already exist)
    await prisma.$executeRawUnsafe(`ALTER TABLE "communication_configs" ADD COLUMN IF NOT EXISTS "whatsappProvider" TEXT DEFAULT 'ultramsg';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "communication_configs" ADD COLUMN IF NOT EXISTS "whatsappApiKey" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "communication_configs" ADD COLUMN IF NOT EXISTS "whatsappInstanceId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "communication_configs" ADD COLUMN IF NOT EXISTS "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;`);
    
    console.log("✅ Successfully added WhatsApp columns via raw SQL.");
  } catch (error) {
    console.error("❌ Failed adding columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

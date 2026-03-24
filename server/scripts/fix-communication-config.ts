import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting Global Communication Configuration Restoration...');

  try {
    // 1. Check if ANY CommunicationConfig exists
    const existingConfig = await prisma.communicationConfig.findFirst();

    const defaultConfig: any = {
      smsEnabled: true,
      emailEnabled: true,
      mpesaEnabled: false,
      smsProvider: 'mobilesasa',
      smsBaseUrl: 'https://api.mobilesasa.com',
      smsSenderId: 'MOBILESASA',
      emailProvider: 'resend',
      emailFrom: 'noreply@zawadijunioracademy.co.ke',
      fromName: 'Zawadi Junior Academy',
      updatedAt: new Date(),
      smsUsername: 'zawadijnr'
    };

    if (existingConfig) {
      console.log('ℹ️  Communication configuration already exists. Enabling services...');
      await prisma.communicationConfig.update({
        where: { id: existingConfig.id },
        data: {
          smsEnabled: true,
          emailEnabled: true,
          updatedAt: new Date()
        }
      });
      console.log('✅ Configuration updated successfully.');
    } else {
      console.log('🆕 Creating new Global Communication configuration...');
      await prisma.communicationConfig.create({
        data: defaultConfig
      });
      console.log('✅ Default configuration created successfully.');
    }

    // 3. Verify
    const finalConfig = await prisma.communicationConfig.findFirst();
    console.log('\n📊 Final Configuration State:');
    console.log(JSON.stringify(finalConfig, null, 2));

  } catch (error: any) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

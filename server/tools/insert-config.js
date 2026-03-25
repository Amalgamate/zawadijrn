const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existingConfig = await prisma.communicationConfig.findFirst();
  if (!existingConfig) {
    const defaultConfig = {
      smsEnabled: true,
      emailEnabled: true,
      mpesaEnabled: false,
      smsProvider: 'mobilesasa',
      smsBaseUrl: 'https://api.mobilesasa.com',
      smsSenderId: 'MOBILESASA',
      emailProvider: 'resend',
      emailFrom: 'noreply@zawadijunioracademy.co.ke',
      emailFromName: 'Zawadi Junior Academy',
      updatedAt: new Date(),
      smsUsername: 'zawadijnr'
    };
    await prisma.communicationConfig.create({ data: defaultConfig });
    console.log('Inserted default CommunicationConfig');
  } else {
    console.log('Config already exists, updating...');
    await prisma.communicationConfig.update({
      where: { id: existingConfig.id },
      data: {
        smsEnabled: true,
        emailEnabled: true,
        updatedAt: new Date()
      }
    });
    console.log('Updated config');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

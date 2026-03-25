import { PrismaClient } from '@prisma/client';
import { encrypt } from './src/utils/encryption.util';

const prisma = new PrismaClient();

async function main() {
  const apiKey = 'atsk_a84afb54bb77f8fe05bf8aab8846332b6b42678aa592f2ec016a8a659b3b79f8b6b89248';
  const username = 'zawadijnr';
  const senderId = 'ZAWADI_JR';

  const encryptedKey = encrypt(apiKey);

  const existingConfig = await prisma.communicationConfig.findFirst();
  
  if (existingConfig) {
    await prisma.communicationConfig.update({
      where: { id: existingConfig.id },
      data: {
        smsProvider: 'africastalking',
        smsApiKey: encryptedKey,
        smsUsername: username,
        smsSenderId: senderId,
        smsEnabled: true,
        updatedAt: new Date()
      }
    });
    console.log('Successfully updated to Africas Talking');
  } else {
    console.log('Config not found to update!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

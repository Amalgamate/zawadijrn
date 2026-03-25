import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './src/utils/encryption.util';

const prisma = new PrismaClient();

async function main() {
  try {
    const config = await prisma.communicationConfig.findFirst();
    if (!config || !config.smsApiKey || !config.smsUsername) {
      console.error("Missing Africa's Talking configuration in DB.");
      return;
    }

    const apiKey = decrypt(config.smsApiKey);
    const username = config.smsUsername;

    const response = await axios.get(`https://api.africastalking.com/version1/user?username=${username}`, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = response.data;
    if (data && data.UserData) {
      console.log('--- Africa\\'s Talking Balance ---');
      console.log('Balance:', data.UserData.balance);
      console.log('---------------------------------');
    } else {
      console.log('Unexpected response:', data);
    }
  } catch (err: any) {
    console.error('Error fetching balance:', err.message);
    if (err.response && err.response.data) {
      console.error('Response data:', err.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

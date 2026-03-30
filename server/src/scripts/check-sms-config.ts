import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSmsConfig() {
    try {
        const config = await prisma.communicationConfig.findFirst();
        if (!config) {
            console.log('❌ No communication config found in database.');
            return;
        }

        console.log('--- SMS Configuration ---');
        console.log(`Enabled: ${config.smsEnabled}`);
        console.log(`Provider: ${config.smsProvider}`);
        console.log(`Sender ID: ${config.smsSenderId}`);
        console.log(`Username: ${config.smsUsername}`);
        console.log(`Has API Key: ${!!config.smsApiKey}`);
        
        // Check WhatsApp as well since it's related
        console.log('\n--- WhatsApp Configuration ---');
        console.log(`Enabled: ${config.whatsappEnabled}`);
        console.log(`Provider: ${config.whatsappProvider}`);
        console.log(`Instance ID: ${config.whatsappInstanceId}`);
        
    } catch (err) {
        console.error('Error fetching config:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSmsConfig();

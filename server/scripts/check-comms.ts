import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- Communication Config ---');
        const config = await prisma.communicationConfig.findFirst();
        if (config) {
            console.log('SMS Enabled:', config.smsEnabled);
            console.log('SMS Provider:', config.smsProvider);
            console.log('SMS API Key [exists]:', !!config.smsApiKey);
            console.log('SMS API Key [isEncrypted]:', config.smsApiKey?.includes(':'));
            console.log('SMS Username:', config.smsUsername);
            console.log('SMS Sender ID:', config.smsSenderId);
        } else {
            console.log('No CommunicationConfig found!');
        }

        console.log('\n--- Sample Learners with Phone ---');
        const learners = await prisma.learner.findMany({
            take: 5,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryContactPhone: true,
                guardianPhone: true
            }
        });

        learners.forEach(l => {
            console.log(`${l.firstName} ${l.lastName}: Primary=${l.primaryContactPhone}, Guardian=${l.guardianPhone}`);
        });

        console.log('\n--- Recent Invoices ---');
        const invoices = await prisma.feeInvoice.findMany({
            take: 5,
            include: { learner: true }
        });

        invoices.forEach(i => {
            console.log(`Invoice ${i.invoiceNumber}: Learner=${i.learner.firstName}, Balance=${(i.balance as any).toString()}`);
        });

    } catch (err) {
        console.error('Error during check:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();

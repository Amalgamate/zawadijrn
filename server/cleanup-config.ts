import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.communicationConfig.updateMany({
        data: {
            smsBaseUrl: null
        }
    });
    console.log('MobileSasa remnants removed from config');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!user) return console.log('No user found');

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        'zawadi-super-secret-jwt-key-2026-change-in-production',
        { expiresIn: '1h' }
    );

    console.log('Sending request...');

    // Try localhost and 127.0.0.1
    const urls = ['http://localhost:5000/api/learners', 'http://127.0.0.1:5000/api/learners'];
    for (const url of urls) {
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = await response.text();
            console.log(`Success on ${url}! Length: ${text.length}`);
            console.log('JSON Snippet:', text.substring(0, 500));
            return;
        } catch (err: any) {
            console.log(`Failed on ${url}:`, err.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBranding() {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
        console.log('No school record found.');
        return;
    }
    console.log('--- Current School Branding Settings ---');
    console.log(`School Name: ${school.name}`);
    console.log(`Brand Color: ${school.brandColor}`);
    console.log(`Logo URL: ${school.logoUrl ? school.logoUrl.substring(0, 50) + '...' : 'NULL'}`);
    console.log(`Favicon URL: ${school.faviconUrl ? school.faviconUrl.substring(0, 50) + '...' : 'NULL'}`);
    console.log(`Stamp URL: ${school.stampUrl ? school.stampUrl.substring(0, 50) + '...' : 'NULL'}`);
    console.log('----------------------------------------');
  } catch (error) {
    console.error('Error fetching school:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranding();

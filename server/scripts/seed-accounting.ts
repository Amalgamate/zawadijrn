import 'dotenv/config';
import { accountingService } from '../src/services/accounting.service';

async function seedAccounting() {
  try {
    console.log('🌱 Seeding default Chart of Accounts and Journals...');
    await accountingService.initializeDefaultCoA();
    console.log('✅ Default Chart of Accounts initialized successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to seed Chart of Accounts:', error?.message || error);
    process.exit(1);
  }
}

seedAccounting();

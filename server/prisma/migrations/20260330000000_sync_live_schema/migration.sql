-- Manual migration to sync live schema with development changes
-- Redundancy check: Add columns only if they don't exist

-- 1. Add cbcGrade to summative_results
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='summative_results' AND column_name='cbcGrade') THEN
        ALTER TABLE "summative_results" ADD COLUMN "cbcGrade" TEXT;
    END IF;
END $$;

-- 2. Add WhatsApp fields to communication_configs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communication_configs' AND column_name='whatsappProvider') THEN
        ALTER TABLE "communication_configs" ADD COLUMN "whatsappProvider" TEXT DEFAULT 'ultramsg';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communication_configs' AND column_name='whatsappApiKey') THEN
        ALTER TABLE "communication_configs" ADD COLUMN "whatsappApiKey" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communication_configs' AND column_name='whatsappInstanceId') THEN
        ALTER TABLE "communication_configs" ADD COLUMN "whatsappInstanceId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communication_configs' AND column_name='whatsappEnabled') THEN
        ALTER TABLE "communication_configs" ADD COLUMN "whatsappEnabled" BOOLEAN DEFAULT false;
    END IF;
END $$;

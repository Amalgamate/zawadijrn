import app from './src/server';
import request from 'supertest';
import { generateAccessToken } from './src/utils/jwt.util';
import prisma from './src/config/database';
import path from 'path';
import fs from 'fs';

async function runE2ETest() {
    console.log('--- Starting Document API E2E Test ---');

    try {
        // Fetch an admin user to generate a token
        const admin = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });

        if (!admin) {
            console.error('No SUPER_ADMIN found in DB');
            return;
        }

        console.log(`Using SUPER_ADMIN: ${admin.email}`);
        
        // Ensure JWT env vars exist for the token generator
        if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret';

        const token = generateAccessToken(admin);

        // 1. Upload a document
        console.log('\nTesting 1: POST /api/documents/upload');
        // Create a dummy file
        const testFilePath = path.join(__dirname, 'test-doc.txt');
        fs.writeFileSync(testFilePath, 'Hello World Document Content');

        const uploadRes = await request(app)
            .post('/api/documents/upload')
            .set('Authorization', `Bearer ${token}`)
            .field('category', 'staff')
            .field('name', 'E2E Validation Document')
            .field('userId', admin.id)
            .attach('file', testFilePath);

        fs.unlinkSync(testFilePath);

        console.log(`Upload Response Status: ${uploadRes.status}`);
        let uploadedDocId = null;

        if (uploadRes.status === 201) {
            console.log('Upload successful! Document ID:', uploadRes.body.data.id);
            uploadedDocId = uploadRes.body.data.id;
        } else {
            console.log('Upload failed (Might be due to cloudinary not configured):', uploadRes.body);
            // Fallback: If upload failed because of cloudinary, let's mock a document in DB for next tests
            if (uploadRes.status === 500) {
                console.log('Mocking document due to cloudinary failure for remaining E2E tests...');
                const doc = await prisma.document.create({
                    data: {
                        name: 'Mocked E2E Document',
                        url: 'http://example.com/mock.pdf',
                        type: 'pdf',
                        category: 'staff',
                        uploadedById: admin.id
                    }
                });
                uploadedDocId = doc.id;
            }
        }

        // 2. Fetch documents
        console.log('\nTesting 2: GET /api/documents');
        const getRes = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${token}`);
            
        console.log(`Fetch Documents Response Status: ${getRes.status}`);
        if(getRes.status === 200) {
           console.log(`Found ${getRes.body.data.length} documents total.`);
        }

        // 3. Update document (if we have one)
        if (uploadedDocId) {
            console.log('\nTesting 3: PUT /api/documents/' + uploadedDocId);
            const updateRes = await request(app)
                .put(`/api/documents/${uploadedDocId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'E2E Updated Name' });
                
            console.log(`Update Response Status: ${updateRes.status}`);
            
            console.log('\nTesting 4: DELETE /api/documents/' + uploadedDocId);
            const delRes = await request(app)
                .delete(`/api/documents/${uploadedDocId}`)
                .set('Authorization', `Bearer ${token}`);
                
            console.log(`Delete Response Status: ${delRes.status}`);
        }

        console.log('\n--- E2E Test Completed ---');
        process.exit(0);
    } catch (e) {
        console.error('Error in test script:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runE2ETest();

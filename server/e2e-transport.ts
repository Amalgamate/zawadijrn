import app from './src/server';
import request from 'supertest';
import { generateAccessToken } from './src/utils/jwt.util';
import prisma from './src/config/database';

async function runTransportE2E() {
    console.log('--- Starting Transport API E2E Test ---');

    try {
        const admin = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });

        if (!admin) {
            console.error('No SUPER_ADMIN found in DB');
            return;
        }

        if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret';
        const token = generateAccessToken(admin);

        // 1. Create a Vehicle
        console.log('\nTesting 1: POST /api/transport/vehicles');
        const vRes = await request(app)
            .post('/api/transport/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .send({
                registrationNumber: `KBZ ${Math.floor(Math.random() * 999)}A`,
                capacity: 45,
                driverName: 'John Doe Testing',
                driverPhone: '0700000000'
            });

        console.log(`Create Vehicle Status: ${vRes.status}`);
        if(vRes.status !== 201) {
             console.error('Failed to create vehicle:', vRes.body);
             process.exit(1);
        }
        const vehicleId = vRes.body.data.id;

        // 2. Fetch Vehicles
        console.log('\nTesting 2: GET /api/transport/vehicles');
        const fetchVRes = await request(app)
            .get('/api/transport/vehicles')
            .set('Authorization', `Bearer ${token}`);
        console.log(`Fetch Vehicles Status: ${fetchVRes.status}, Count: ${fetchVRes.body.data.length}`);

        // 3. Create a Route
        console.log('\nTesting 3: POST /api/transport/routes');
        const rRes = await request(app)
            .post('/api/transport/routes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Route Nairobi',
                description: 'Nairobi Central -> Kileleshwa',
                amount: 3500,
                vehicleId: vehicleId
            });

        console.log(`Create Route Status: ${rRes.status}`);
        if(rRes.status !== 201) {
             console.error('Failed to create route:', rRes.body);
             process.exit(1);
        }
        const routeId = rRes.body.data.id;

        // 4. Fetch Routes
        console.log('\nTesting 4: GET /api/transport/routes');
        const fetchRRes = await request(app)
            .get('/api/transport/routes')
            .set('Authorization', `Bearer ${token}`);
        console.log(`Fetch Routes Status: ${fetchRRes.status}, Count: ${fetchRRes.body.data.length}`);
        if(fetchRRes.body.data.length > 0) {
             console.log(`First route amount is: KES ${fetchRRes.body.data[0].amount}`);
        }

        // 5. Delete Route
        console.log('\nTesting 5: DELETE /api/transport/routes/' + routeId);
        const delRRes = await request(app)
            .delete(`/api/transport/routes/${routeId}`)
            .set('Authorization', `Bearer ${token}`);
        console.log(`Delete Route Status: ${delRRes.status}`);

        // 6. Delete Vehicle
        console.log('\nTesting 6: DELETE /api/transport/vehicles/' + vehicleId);
        const delVRes = await request(app)
            .delete(`/api/transport/vehicles/${vehicleId}`)
            .set('Authorization', `Bearer ${token}`);
        console.log(`Delete Vehicle Status: ${delVRes.status}`);

        console.log('\n--- E2E Test Completed Successfully ---');
        process.exit(0);
    } catch (e) {
        console.error('Error in test script:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runTransportE2E();

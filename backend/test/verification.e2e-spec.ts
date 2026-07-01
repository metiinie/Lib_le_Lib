/**
 * verification.e2e-spec.ts
 *
 * Verifies Phase 3 requirements from backend-plan.md:
 *   - POST /verification/submissions
 *   - GET /verification/me/status
 *   - GET /verification/queue
 *   - POST /verification/:id/decision
 *
 * Privacy / security cases from testing.md (Verification isolation):
 *   - Attempt to read queue or decide as non-officer member -> 403
 *   - Read/Decide as verification_officer -> 200
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { VerificationStorageService } from '../src/verification/verification-storage.service';
import { UsersRepository } from '../src/users/repositories/users.repository';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

function makeToken(
  app: INestApplication,
  userId: string,
  role: string = 'member',
): string {
  const jwt = app.get(JwtService);
  return jwt.sign(
    { sub: userId, role },
    { secret: 'test_jwt_secret_do_not_use_in_prod', expiresIn: '1h' },
  );
}

describe('Phase 3 — Verification (e2e)', () => {
  let app: INestApplication;
  let storageMock: Partial<VerificationStorageService>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Mock VerificationStorageService
    storageMock = {
      getDocumentUploadUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/put-signed-url'),
      getDocumentReadUrl: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(`https://s3.example.com/get/${key}`),
        ),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VerificationStorageService)
      .useValue(storageMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Verification flows and isolation', () => {
    let memberToken: string;
    let memberUserId: string;
    let officerToken: string;
    let officerUserId: string;
    let verificationRecordId: string;

    beforeAll(async () => {
      const usersRepo = app.get(UsersRepository);

      // Create member user
      const memberPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const member = await usersRepo.createFromDestination(memberPhone);
      memberUserId = member.id;
      memberToken = makeToken(app, memberUserId, 'member');

      // Create officer user (directly in DB to set role)
      const officerPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const officer = await usersRepo.createFromDestination(officerPhone);
      await dataSource.query(
        `UPDATE users SET role = 'verification_officer' WHERE id = $1`,
        [officer.id],
      );
      officerUserId = officer.id;
      officerToken = makeToken(app, officerUserId, 'verification_officer');
    });

    it('POST /verification/submissions as member returns 201 with upload URL, no storageRef', async () => {
      const res = await request(app.getHttpServer())
        .post('/verification/submissions')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          documentType: 'id_card',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body.uploadUrl).toContain(
        'https://s3.example.com/put-signed-url',
      );
      expect(res.body.storageRef).toBeUndefined(); // Important constraint check
    });

    it('GET /verification/me/status as member returns submitted status', async () => {
      const res = await request(app.getHttpServer())
        .get('/verification/me/status')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.status).toBe('submitted');
    });

    it('GET /verification/queue as member returns 403 (Verification isolation)', async () => {
      await request(app.getHttpServer())
        .get('/verification/queue')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('GET /verification/queue as verification_officer returns 200 and data', async () => {
      const res = await request(app.getHttpServer())
        .get('/verification/queue')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const record = res.body.find((r: any) => r.userId === memberUserId);
      expect(record).toBeDefined();
      expect(record.status).toBe('submitted');
      verificationRecordId = record.id;

      // Ensure signed URL is present
      expect(record.documents[0].url).toContain('https://s3.example.com/get/');
    });

    it('POST /verification/:id/decision as member returns 403 (Verification isolation)', async () => {
      await request(app.getHttpServer())
        .post(`/verification/${verificationRecordId}/decision`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ decision: 'approved' })
        .expect(403);
    });

    it('POST /verification/:id/decision as officer with rejected but no reason -> 400', async () => {
      await request(app.getHttpServer())
        .post(`/verification/${verificationRecordId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'rejected' })
        .expect(400);
    });

    it('POST /verification/:id/decision as officer with rejected + reason -> 200', async () => {
      await request(app.getHttpServer())
        .post(`/verification/${verificationRecordId}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'rejected', rejectionReason: 'Blurry document' })
        .expect(200);

      const statusRes = await request(app.getHttpServer())
        .get('/verification/me/status')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(statusRes.body.status).toBe('rejected');
      expect(statusRes.body.rejectionReason).toBe('Blurry document');

      // Backdate the decision_at to bypass the 24-hour resubmission cooldown
      await dataSource.query(
        `UPDATE verification.verification_records SET decision_at = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        [verificationRecordId],
      );
    });

    it('POST /verification/submissions as member again (resubmission) -> 201', async () => {
      await request(app.getHttpServer())
        .post('/verification/submissions')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ documentType: 'id_card', contentType: 'image/jpeg' })
        .expect(201);
    });

    it('POST /verification/:id/decision as officer with approved -> 200 + audit_logs row', async () => {
      // Find new record ID
      const queueRes = await request(app.getHttpServer())
        .get('/verification/queue')
        .set('Authorization', `Bearer ${officerToken}`)
        .expect(200);

      const newRecord = queueRes.body.find(
        (r: any) => r.userId === memberUserId && r.status === 'submitted',
      );
      expect(newRecord).toBeDefined();

      await request(app.getHttpServer())
        .post(`/verification/${newRecord.id}/decision`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ decision: 'approved' })
        .expect(200);

      // Check DB directly for audit logs
      const logs = await dataSource.query(
        `SELECT * FROM audit_logs WHERE target_id = $1`,
        [newRecord.id],
      );
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('verification_decision');
      expect(logs[0].actor_id).toBe(officerUserId);
    });

    it('Direct DB query: SELECT * FROM verification.documents as app DB user', async () => {
      const docs = await dataSource.query(
        `SELECT * FROM verification.documents WHERE verification_record_id = $1`,
        [verificationRecordId],
      );
      expect(docs.length).toBeGreaterThan(0);
      // Ensure storage_ref exists in DB, confirming it wasn't returned in the public API
      expect(docs[0].storage_ref).toBeDefined();
    });
  });
});

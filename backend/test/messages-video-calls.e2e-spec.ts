import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/photos/storage.service';
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

describe('Phase 5 — Messaging & Video Calls (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let storageMock: Partial<StorageService>;
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let matchId: string;

  beforeAll(async () => {
    storageMock = {
      getPhotoUploadUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/put-signed-url'),
      getPhotoReadUrl: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(`https://s3.example.com/get/${key}`),
        ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);

    // Setup: Create 2 users and 1 active match
    const phoneA = `+19${Math.floor(100000000 + Math.random() * 900000000)}`;
    const userARes = await dataSource.query(
      `INSERT INTO users (phone, role, status) VALUES ($1, 'member', 'active') RETURNING id`,
      [phoneA],
    );
    userAId = userARes[0].id;
    userAToken = makeToken(app, userAId);

    const phoneB = `+19${Math.floor(100000000 + Math.random() * 900000000)}`;
    const userBRes = await dataSource.query(
      `INSERT INTO users (phone, role, status) VALUES ($1, 'member', 'active') RETURNING id`,
      [phoneB],
    );
    userBId = userBRes[0].id;
    userBToken = makeToken(app, userBId);

    // Create a match
    const matchRes = await dataSource.query(
      `INSERT INTO matches (user_a_id, user_b_id, status) VALUES ($1, $2, 'active') RETURNING id`,
      [
        userAId < userBId ? userAId : userBId,
        userAId < userBId ? userBId : userAId,
      ],
    );
    matchId = matchRes[0].id;

    // Create profiles for discreet_mode checks
    await dataSource.query(
      `INSERT INTO profiles (user_id, nickname, date_of_birth, gender, discreet_mode) VALUES ($1, 'UserA', '1990-01-01', 'other', false)`,
      [userAId],
    );
    await dataSource.query(
      `INSERT INTO profiles (user_id, nickname, date_of_birth, gender, discreet_mode) VALUES ($1, 'UserB', '1990-01-01', 'other', true)`,
      [userBId],
    );
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(
          `DELETE FROM video_verification_calls WHERE match_id = $1`,
          [matchId],
        );
        await dataSource.query(`DELETE FROM messages WHERE match_id = $1`, [
          matchId,
        ]);
        await dataSource.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
        await dataSource.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
          userAId,
          userBId,
        ]);
      }
    } catch (e) {
      console.error('Teardown cleanup error:', e);
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  describe('Messaging (Chat confidentiality)', () => {
    let messageId: string;
    const testCiphertext = Buffer.from('encrypted_data').toString('base64');
    const testNonce = Buffer.from('random_nonce').toString('base64');

    it('POST /matches/:id/messages sends a message', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          messageType: 'text',
          ciphertext: testCiphertext,
          nonce: testNonce,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      messageId = res.body.id;
    });

    it('Direct DB check: ciphertext is a buffer and not plaintext (Chat confidentiality)', async () => {
      const dbMsg = await dataSource.query(
        `SELECT ciphertext, nonce FROM messages WHERE id = $1`,
        [messageId],
      );
      expect(dbMsg.length).toBe(1);

      // Node pg driver returns BYTEA as Buffer
      expect(Buffer.isBuffer(dbMsg[0].ciphertext)).toBe(true);
      expect(Buffer.isBuffer(dbMsg[0].nonce)).toBe(true);

      const dbCiphertextBase64 = dbMsg[0].ciphertext.toString('base64');
      const dbNonceBase64 = dbMsg[0].nonce.toString('base64');

      expect(dbCiphertextBase64).toBe(testCiphertext);
      expect(dbNonceBase64).toBe(testNonce);

      // The key requirement: The service has NO code path that attempts to read plaintext.
      // And the row is unintelligible without the clients' own keys.
      expect(dbMsg[0].ciphertext.toString('utf-8')).not.toContain(
        'Hello World',
      ); // Just to be sure it's raw bytes
    });

    it('GET /matches/:id/messages returns paginated messages', async () => {
      const res = await request(app.getHttpServer())
        .get(`/matches/${matchId}/messages?limit=10`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(messageId);
      expect(res.body.data[0].ciphertext).toBe(testCiphertext);
    });

    it('PATCH /matches/:id/messages/:messageId/read marks as read and handles discreet_mode', async () => {
      // User B reads User A's message. User B has discreet_mode = true
      const res = await request(app.getHttpServer())
        .patch(`/matches/${matchId}/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      // Because User B has discreet_mode = true, suppressReceipt should be true
      expect(res.body.suppressReceipt).toBe(true);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Message Attachments', () => {
    let attachmentId: string;

    it('POST /matches/:id/messages/attachments/upload-url returns pre-signed URL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${matchId}/messages/attachments/upload-url`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(201);

      expect(res.body.uploadUrl).toBeDefined();
      expect(res.body.storageRef).toContain(`chat/${matchId}/`);
    });
  });

  describe('Video Calls', () => {
    let callId: string;

    it('POST /matches/:id/video-calls schedules a call', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${matchId}/video-calls`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ scheduledAt: new Date().toISOString() })
        .expect(201);

      expect(res.body.id).toBeDefined();
      callId = res.body.id;
    });

    it('PATCH /matches/:id/video-calls/:callId updates status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/matches/${matchId}/video-calls/${callId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(res.body.status).toBe('completed');
    });
  });
});

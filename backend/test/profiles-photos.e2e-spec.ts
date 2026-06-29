/**
 * profiles-photos.e2e-spec.ts
 *
 * Verifies Phase 2 requirements from backend-plan.md:
 *   - GET/POST/PATCH /profiles/me
 *   - GET /regions, GET /interest-tags
 *   - POST /photos/upload-url, POST /photos, GET /photos/:id
 *   - POST /photos/:id/reveal-grants, DELETE /photos/:id/reveal-grants/:userId
 *
 * Privacy / security cases from testing.md (Blur/reveal + Revoked reveal):
 *   1. An ungranted viewer receives the _blurred URL (never the original key).
 *   2. After a grant the viewer receives the _original URL.
 *   3. After revocation the viewer is back to _blurred.
 *
 * StorageService is mocked — presigned URL generation touches a live bucket in
 * integration tests, not in e2e. Here we verify the grant-resolution logic,
 * not the AWS SDK call.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/photos/storage.service';
import { UsersRepository } from '../src/users/repositories/users.repository';
import { ProfilesRepository } from '../src/profiles/repositories/profiles.repository';
import { JwtService } from '@nestjs/jwt';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeToken(app: INestApplication, userId: string): string {
  const jwt = app.get(JwtService);
  return jwt.sign(
    { sub: userId, role: 'member' },
    { secret: 'test_jwt_secret_do_not_use_in_prod', expiresIn: '1h' },
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Phase 2 — Profiles & Photos (e2e)', () => {
  let app: INestApplication;
  let storageMock: Partial<StorageService>;

  beforeAll(async () => {
    // Mock StorageService so tests don't hit real cloud storage.
    storageMock = {
      getPhotoUploadUrl: jest.fn().mockResolvedValue('https://r2.example.com/put-signed-url'),
      getPhotoReadUrl: jest.fn().mockImplementation((key: string) =>
        Promise.resolve(`https://r2.example.com/get/${key}`),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Reference data ──────────────────────────────────────────────────────────

  describe('Reference data', () => {
    it('GET /regions returns an array', async () => {
      const res = await request(app.getHttpServer()).get('/regions').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /interest-tags returns an array', async () => {
      const res = await request(app.getHttpServer()).get('/interest-tags').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Profiles ────────────────────────────────────────────────────────────────

  describe('Profiles', () => {
    let ownerToken: string;
    let ownerUserId: string;

    beforeAll(async () => {
      // Create a user directly via UsersRepository
      const usersRepo = app.get(UsersRepository);
      const phone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const user = await usersRepo.createFromDestination(phone);
      ownerUserId = user.id;
      ownerToken = makeToken(app, ownerUserId);
    });

    it('GET /profiles/me returns 404 when no profile exists', async () => {
      await request(app.getHttpServer())
        .get('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });

    it('POST /profiles/me rejects underage (< 18)', async () => {
      const res = await request(app.getHttpServer())
        .post('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          nickname: 'Youngster',
          dateOfBirth: new Date().toISOString().split('T')[0], // today → age 0
          gender: 'man',
          relationshipGoals: ['friendship'],
        })
        .expect(400);
      expect(res.body.error.code).toBe('UNDERAGE');
    });

    it('POST /profiles/me creates a profile for an adult', async () => {
      const res = await request(app.getHttpServer())
        .post('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          nickname: 'Alex',
          dateOfBirth: '1995-06-15',
          gender: 'man',
          relationshipGoals: ['serious_relationship', 'friendship'],
          bio: 'Testing profile creation.',
        })
        .expect(201);

      expect(res.body.nickname).toBe('Alex');
      expect(res.body.userId).toBe(ownerUserId);
    });

    it('GET /profiles/me returns the created profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(res.body.nickname).toBe('Alex');
    });

    it('POST /profiles/me returns 409 if profile already exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          nickname: 'Duplicate',
          dateOfBirth: '1990-01-01',
          gender: 'woman',
          relationshipGoals: ['marriage'],
        })
        .expect(409);
      expect(res.body.error.code).toBe('PROFILE_EXISTS');
    });

    it('PATCH /profiles/me updates bio', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profiles/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ bio: 'Updated bio.' })
        .expect(200);
      expect(res.body.bio).toBe('Updated bio.');
    });
  });

  // ── Photos — Blur/Reveal ────────────────────────────────────────────────────

  describe('Photos — Blur / Reveal Grant pattern', () => {
    let ownerToken: string;
    let ownerUserId: string;
    let viewerToken: string;
    let viewerUserId: string;
    let photoId: string;

    beforeAll(async () => {
      const usersRepo = app.get(UsersRepository);
      const profilesRepo = app.get(ProfilesRepository);

      const ownerPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const owner = await usersRepo.createFromDestination(ownerPhone);
      ownerUserId = owner.id;
      ownerToken = makeToken(app, ownerUserId);
      // Create profile so photos FK (profile_id → profiles.user_id) is satisfied
      await profilesRepo.saveProfile({
        userId: ownerUserId,
        nickname: 'PhotoOwner',
        dateOfBirth: '1990-05-20',
        gender: 'man',
        relationshipGoals: ['friendship'],
      });

      const viewerPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const viewer = await usersRepo.createFromDestination(viewerPhone);
      viewerUserId = viewer.id;
      viewerToken = makeToken(app, viewerUserId);
      // Viewer also gets a profile (not strictly required but keeps DB consistent)
      await profilesRepo.saveProfile({
        userId: viewerUserId,
        nickname: 'PhotoViewer',
        dateOfBirth: '1992-03-10',
        gender: 'woman',
        relationshipGoals: ['friendship'],
      });
    });

    it('POST /photos/upload-url returns a signed URL and storageRef', async () => {
      const res = await request(app.getHttpServer())
        .post('/photos/upload-url')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contentType: 'image/jpeg' })
        .expect(201);

      expect(res.body.uploadUrl).toContain('https://r2.example.com/put-signed-url');
      expect(res.body.storageRef).toContain('_original');
    });

    it('POST /photos registers a photo row', async () => {
      // Get a fresh storageRef
      const urlRes = await request(app.getHttpServer())
        .post('/photos/upload-url')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contentType: 'image/jpeg' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/photos')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ storageRef: urlRes.body.storageRef, isPrimary: true })
        .expect(201);

      photoId = res.body.id;
      expect(photoId).toBeDefined();
      expect(res.body.blurredDefault).toBe(true);
    });

    it('GET /photos/:id returns BLURRED URL for an ungranted viewer', async () => {
      const res = await request(app.getHttpServer())
        .get(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      // constraints.md: "A photo is never sent unblurred to a client unless an
      // active, non-revoked photo_reveal_grants row exists for that exact viewer."
      expect(res.body.blurred).toBe(true);
      expect(res.body.url).toContain('_blurred');
      // The original key must NOT appear in the blurred response
      expect(res.body.url).not.toContain('_original');
    });

    it('GET /photos/:id returns ORIGINAL URL for the owner', async () => {
      const res = await request(app.getHttpServer())
        .get(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(res.body.blurred).toBe(false);
      expect(res.body.url).toContain('_original');
    });

    it('POST /photos/:id/reveal-grants grants reveal to viewer', async () => {
      await request(app.getHttpServer())
        .post(`/photos/${photoId}/reveal-grants`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ viewerUserId })
        .expect(201);
    });

    it('GET /photos/:id returns ORIGINAL URL after grant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
      expect(res.body.blurred).toBe(false);
      expect(res.body.url).toContain('_original');
    });

    it('POST /photos/:id/reveal-grants returns 409 if grant already exists', async () => {
      const res = await request(app.getHttpServer())
        .post(`/photos/${photoId}/reveal-grants`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ viewerUserId })
        .expect(409);
      expect(res.body.error.code).toBe('GRANT_EXISTS');
    });

    it('DELETE /photos/:id/reveal-grants/:viewerUserId revokes the grant', async () => {
      await request(app.getHttpServer())
        .delete(`/photos/${photoId}/reveal-grants/${viewerUserId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);
    });

    it('GET /photos/:id returns BLURRED URL again after revocation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/photos/${photoId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      // After revocation, back to blurred — the Revoked reveal case from testing.md
      expect(res.body.blurred).toBe(true);
      expect(res.body.url).toContain('_blurred');
      expect(res.body.url).not.toContain('_original');
    });

    it('A non-owner cannot grant reveals on another user photo', async () => {
      const res = await request(app.getHttpServer())
        .post(`/photos/${photoId}/reveal-grants`)
        .set('Authorization', `Bearer ${viewerToken}`) // viewer tries to grant, not owner
        .send({ viewerUserId: ownerUserId })
        .expect(403);
      expect(res.body.error.code).toBe('NOT_PHOTO_OWNER');
    });
  });
});

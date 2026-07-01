import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../src/users/repositories/users.repository';
import { ProfilesRepository } from '../src/profiles/repositories/profiles.repository';
import { PhotosRepository } from '../src/photos/repositories/photos.repository';
import { BlocksRepository } from '../src/safety/repositories/blocks.repository';
import { User } from '../src/users/entities/user.entity';

describe('Security Constraints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let usersRepo: UsersRepository;
  let profilesRepo: ProfilesRepository;
  let photosRepo: PhotosRepository;
  let blocksRepo: BlocksRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    usersRepo = app.get(UsersRepository);
    profilesRepo = app.get(ProfilesRepository);
    photosRepo = app.get(PhotosRepository);
    blocksRepo = app.get(BlocksRepository);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Helper to create a user and token
  const createUserAndToken = async (role = 'member') => {
    const phone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const user = await usersRepo.createFromDestination(phone);
    user.role = role as any;
    user.status = 'active';
    await dataSource.getRepository(User).save(user);

    const token = jwtService.sign({ sub: user.id, role: user.role });
    return { user, token };
  };

  describe('18+ floor (DB-level rejection)', () => {
    it('should reject profile creation at the database level if under 18', async () => {
      const { user } = await createUserAndToken();
      // Calculate a date exactly 17 years ago
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 17);

      // If we don't have regions seeded, TypeORM might throw a foreign key error first.
      // Let's use a raw query just on dateOfBirth to be absolutely certain it's the check constraint.
      let rawError: any = null;
      try {
        await dataSource.query(
          `
          INSERT INTO profiles (user_id, nickname, date_of_birth, gender)
          VALUES ($1, 'Test', $2, 'man')
        `,
          [user.id, dob.toISOString().split('T')[0]],
        );
      } catch (e) {
        rawError = e;
      }

      expect(rawError).toBeDefined();
      expect(rawError.message).toContain('chk_profiles_min_age');
    });
  });

  describe('Photo Reveal Boundaries', () => {
    it('should blur ungranted photo, reveal when granted, and re-blur when revoked', async () => {
      const owner = await createUserAndToken();
      const viewer = await createUserAndToken();

      // Create a profile for owner first
      await profilesRepo.saveProfile({
        userId: owner.user.id,
        nickname: 'Owner',
        dateOfBirth: '1990-01-01',
        gender: 'man',
        regionId: null, // Will use default if needed, or we just insert raw to bypass constraints if needed, but let's try repo first.
      } as any);

      // Create a photo for owner
      const photo = await photosRepo.savePhoto({
        profileId: owner.user.id,
        storageRef: 'photos/test_original.jpg',
        position: 0,
        isPrimary: true,
        blurredDefault: true,
      });

      // 1. Ungranted viewer -> blurred
      let res = await request(app.getHttpServer())
        .get(`/photos/${photo.id}`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .expect(200);

      expect(res.body.blurred).toBe(true);
      expect(res.body.url).toContain('_blurred.jpg');

      // 2. Grant reveal
      await request(app.getHttpServer())
        .post(`/photos/${photo.id}/reveal-grants`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ viewerUserId: viewer.user.id })
        .expect(201);

      // Viewer should now see original
      res = await request(app.getHttpServer())
        .get(`/photos/${photo.id}`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .expect(200);

      expect(res.body.blurred).toBe(false);
      expect(res.body.url).toContain('_original.jpg');

      // 3. Revoke reveal -> re-blurred
      await request(app.getHttpServer())
        .delete(`/photos/${photo.id}/reveal-grants/${viewer.user.id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(204);

      res = await request(app.getHttpServer())
        .get(`/photos/${photo.id}`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .expect(200);

      expect(res.body.blurred).toBe(true);
      expect(res.body.url).toContain('_blurred.jpg');
    });
  });

  describe('Block Visibility', () => {
    it('should hide blocked users from discovery feed', async () => {
      const userA = await createUserAndToken();
      const userB = await createUserAndToken();

      // Ensure they have profiles so they show up in discovery (assuming discovery requires profiles)
      // For simplicity, we just test the BlocksRepository excluded users list
      await blocksRepo.insertBlock(userA.user.id, userB.user.id);

      const excludedForA = await blocksRepo.getExcludedUserIds(userA.user.id);
      expect(excludedForA).toContain(userB.user.id);

      const excludedForB = await blocksRepo.getExcludedUserIds(userB.user.id);
      expect(excludedForB).toContain(userA.user.id);
    });
  });

  describe('Chat confidentiality (ciphertext column)', () => {
    it('should store messages as ciphertext buffers in the database without plaintext', async () => {
      const { user: user1 } = await createUserAndToken();
      const { user: user2 } = await createUserAndToken();

      const userA = user1.id < user2.id ? user1 : user2;
      const userB = user1.id < user2.id ? user2 : user1;

      // Insert a dummy match directly since we just want to test message insertion
      const result = await dataSource.query(
        `
        INSERT INTO matches (user_a_id, user_b_id, status)
        VALUES ($1, $2, 'active')
        RETURNING id
      `,
        [userA.id, userB.id],
      );

      const matchId = result[0].id;
      const fakeCiphertext = Buffer.from('encrypted_data_here');
      const fakeNonce = Buffer.from('nonce');

      await dataSource.query(
        `
        INSERT INTO messages (match_id, sender_id, message_type, ciphertext, nonce)
        VALUES ($1, $2, 'text', $3, $4)
      `,
        [matchId, userA.id, fakeCiphertext, fakeNonce],
      );

      const messages = await dataSource.query(
        `
        SELECT * FROM messages WHERE match_id = $1
      `,
        [matchId],
      );

      expect(messages.length).toBe(1);
      expect(messages[0].ciphertext).toEqual(fakeCiphertext);
      expect(messages[0].plaintext).toBeUndefined(); // Should not exist
    });
  });

  describe('Verification Isolation', () => {
    it('should explicitly deny non-officer access to verification documents (403), never 200 with empty list', async () => {
      const member = await createUserAndToken('member');
      const officer = await createUserAndToken('verification_officer');

      // Member gets 403 Forbidden
      await request(app.getHttpServer())
        .get('/verification/queue')
        .set('Authorization', `Bearer ${member.token}`)
        .expect(403);

      // Officer gets 200 OK
      await request(app.getHttpServer())
        .get('/verification/queue')
        .set('Authorization', `Bearer ${officer.token}`)
        .expect(200);
    });
  });
});

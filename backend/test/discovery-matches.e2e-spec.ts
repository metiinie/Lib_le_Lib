/**
 * discovery-matches.e2e-spec.ts
 *
 * Verifies Phase 4 requirements from backend-plan.md:
 *   - GET /discovery — filters, block exclusion, self exclusion, already-swiped exclusion
 *   - POST /swipes — like/pass; reports back { matched: true/false }
 *   - GET /matches — active matches; block exclusion retroactively applied
 *   - GET /compatibility-quiz/questions — returns seeded questions
 *   - POST /compatibility-quiz/responses — saves a response
 *
 * Privacy / security cases (from testing.md and business-rules.md):
 *   - Mutual match: User A likes B, B likes A -> { matched: true } and match row exists.
 *   - Block exclusion: A blocks C -> C removed from A's discovery AND match list.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersRepository } from '../src/users/repositories/users.repository';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

function makeToken(app: INestApplication, userId: string, role: string = 'member'): string {
  const jwt = app.get(JwtService);
  return jwt.sign(
    { sub: userId, role },
    { secret: 'test_jwt_secret_do_not_use_in_prod', expiresIn: '1h' },
  );
}

describe('Phase 4 — Discovery & Matching (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Discovery & Swipes & Matches
  // ──────────────────────────────────────────────────────────────────────────
  describe('Discovery, Swipes, and Mutual Match', () => {
    let userA_id: string;
    let userA_token: string;
    let userB_id: string;
    let userB_token: string;
    let userC_id: string; // C will be blocked
    let userC_token: string;
    let matchId: string;

    beforeAll(async () => {
      const usersRepo = app.get(UsersRepository);

      // Create User A
      const phoneA = `+1999${Math.floor(1000000 + Math.random() * 9000000)}`;
      const userA = await usersRepo.createFromDestination(phoneA);
      userA_id = userA.id;
      userA_token = makeToken(app, userA_id, 'member');

      // Create User B
      const phoneB = `+1999${Math.floor(1000000 + Math.random() * 9000000)}`;
      const userB = await usersRepo.createFromDestination(phoneB);
      userB_id = userB.id;
      userB_token = makeToken(app, userB_id, 'member');

      // Create User C (will be blocked later)
      const phoneC = `+1999${Math.floor(1000000 + Math.random() * 9000000)}`;
      const userC = await usersRepo.createFromDestination(phoneC);
      userC_id = userC.id;
      userC_token = makeToken(app, userC_id, 'member');

      // Seed minimal profiles for A, B, and C so discovery query works
      const dob = '1994-05-20'; // 30 years old
      for (const uid of [userA_id, userB_id, userC_id]) {
        const nickname = `TestUser_${uid.slice(0, 6)}`;
        await dataSource.query(
          `INSERT INTO profiles (user_id, nickname, date_of_birth, gender)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO NOTHING`,
          [uid, nickname, dob, 'other'],
        );
        // Discovery query filters by u.status = 'active'; new users default to 'pending'
        await dataSource.query(`UPDATE users SET status = 'active' WHERE id = $1`, [uid]);
      }
    });

    afterAll(async () => {
      // Clean up all test data
      const ids = [userA_id, userB_id, userC_id].filter(Boolean);
      if (ids.length > 0) {
        await dataSource.query(`DELETE FROM swipes WHERE actor_id = ANY($1::uuid[]) OR target_id = ANY($1::uuid[])`, [ids]);
        await dataSource.query(`DELETE FROM matches WHERE user_a_id = ANY($1::uuid[]) OR user_b_id = ANY($1::uuid[])`, [ids]);
        await dataSource.query(`DELETE FROM blocks WHERE blocker_id = ANY($1::uuid[]) OR blocked_id = ANY($1::uuid[])`, [ids]);
        await dataSource.query(`DELETE FROM profiles WHERE user_id = ANY($1::uuid[])`, [ids]);
        await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [ids]);
      }
    });

    it('GET /discovery as User A returns other users (B and C visible)', async () => {
      const res = await request(app.getHttpServer())
        .get('/discovery')
        .set('Authorization', `Bearer ${userA_token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const returnedIds = res.body.map((u: any) => u.userId);

      // A should NOT see themselves
      expect(returnedIds).not.toContain(userA_id);
      // A should see B and C (they exist with active status)
      expect(returnedIds).toContain(userB_id);
      expect(returnedIds).toContain(userC_id);
    });

    it('POST /swipes — User A likes User B -> { matched: false }', async () => {
      const res = await request(app.getHttpServer())
        .post('/swipes')
        .set('Authorization', `Bearer ${userA_token}`)
        .send({ targetId: userB_id, action: 'like' })
        .expect(201);

      expect(res.body.matched).toBe(false);

      // Verify that NO match row exists in the DB yet (testing.md requirement)
      const count = await dataSource.query(`
        SELECT COUNT(*) as count FROM matches 
        WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)
      `, [userA_id, userB_id]);
      expect(parseInt(count[0].count)).toBe(0);
    });

    it('GET /discovery as User A excludes User B (already swiped)', async () => {
      const res = await request(app.getHttpServer())
        .get('/discovery')
        .set('Authorization', `Bearer ${userA_token}`)
        .expect(200);

      const returnedIds = res.body.map((u: any) => u.userId);
      // B was already swiped on, so must not appear
      expect(returnedIds).not.toContain(userB_id);
    });

    it('POST /swipes — User B likes User A back -> { matched: true } (Mutual Match)', async () => {
      const res = await request(app.getHttpServer())
        .post('/swipes')
        .set('Authorization', `Bearer ${userB_token}`)
        .send({ targetId: userA_id, action: 'like' })
        .expect(201);

      // The DB trigger fn_create_match_on_mutual_like creates the match row
      expect(res.body.matched).toBe(true);
    });

    it('GET /matches — User A sees User B in active matches', async () => {
      const res = await request(app.getHttpServer())
        .get('/matches')
        .set('Authorization', `Bearer ${userA_token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const matchedUserIds = res.body.map((m: any) => m.userId);
      expect(matchedUserIds).toContain(userB_id);

      // Save match ID for later
      const matchData = res.body.find((m: any) => m.userId === userB_id);
      matchId = matchData?.matchId;
    });

    it('Verify match row exists in DB', async () => {
      const [minId, maxId] = [userA_id, userB_id].sort();
      const rows = await dataSource.query(
        `SELECT * FROM matches WHERE user_a_id = $1 AND user_b_id = $2 AND status = 'active'`,
        [minId, maxId],
      );
      expect(rows.length).toBe(1);
    });

    it('POST /swipes — duplicate swipe returns 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/swipes')
        .set('Authorization', `Bearer ${userA_token}`)
        .send({ targetId: userB_id, action: 'like' })
        .expect(409);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Block Exclusion (core privacy constraint)
    // ──────────────────────────────────────────────────────────────────────
    describe('Block exclusion (privacy constraint)', () => {
      it('User A likes User C', async () => {
        const res = await request(app.getHttpServer())
          .post('/swipes')
          .set('Authorization', `Bearer ${userA_token}`)
          .send({ targetId: userC_id, action: 'like' })
          .expect(201);
        expect(res.body.matched).toBe(false);
      });

      it('User C likes User A back -> mutual match (C visible in A matches before block)', async () => {
        const res = await request(app.getHttpServer())
          .post('/swipes')
          .set('Authorization', `Bearer ${userC_token}`)
          .send({ targetId: userA_id, action: 'like' })
          .expect(201);
        expect(res.body.matched).toBe(true);
      });

      it('A blocks C directly in DB (simulating Phase 6 POST /blocks)', async () => {
        // We directly insert to the blocks table because full Phase 6 controller
        // is not yet built. This is the correct approach per scope.md.
        await dataSource.query(
          `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)`,
          [userA_id, userC_id],
        );
      });

      it('GET /discovery as User A no longer contains User C (block exclusion)', async () => {
        const res = await request(app.getHttpServer())
          .get('/discovery')
          .set('Authorization', `Bearer ${userA_token}`)
          .expect(200);

        const returnedIds = res.body.map((u: any) => u.userId);
        expect(returnedIds).not.toContain(userC_id);
      });

      it('GET /discovery as User C no longer contains User A (mutual block exclusion)', async () => {
        const res = await request(app.getHttpServer())
          .get('/discovery')
          .set('Authorization', `Bearer ${userC_token}`)
          .expect(200);

        const returnedIds = res.body.map((u: any) => u.userId);
        expect(returnedIds).not.toContain(userA_id);
      });

      it('GET /matches as User A no longer contains User C after block', async () => {
        const res = await request(app.getHttpServer())
          .get('/matches')
          .set('Authorization', `Bearer ${userA_token}`)
          .expect(200);

        const matchedUserIds = res.body.map((m: any) => m.userId);
        // C was matched but now blocked — must be invisible
        expect(matchedUserIds).not.toContain(userC_id);
        // B remains visible (not blocked)
        expect(matchedUserIds).toContain(userB_id);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Compatibility Quiz
  // ──────────────────────────────────────────────────────────────────────────
  describe('Compatibility Quiz', () => {
    let quizUser_id: string;
    let quizUser_token: string;
    let questionId: string;
    let optionId: string;

    beforeAll(async () => {
      const usersRepo = app.get(UsersRepository);
      const phone = `+1888${Math.floor(1000000 + Math.random() * 9000000)}`;
      const user = await usersRepo.createFromDestination(phone);
      quizUser_id = user.id;
      quizUser_token = makeToken(app, quizUser_id, 'member');

      // Seed a profile so the quiz can reference profile_id
      await dataSource.query(
        `INSERT INTO profiles (user_id, nickname, date_of_birth, gender)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING`,
        [quizUser_id, 'QuizUser', '1990-01-01', 'other'],
      );
    });

    afterAll(async () => {
      if (quizUser_id) {
        await dataSource.query(`DELETE FROM compatibility_quiz_responses WHERE profile_id = $1`, [quizUser_id]);
        await dataSource.query(`DELETE FROM profiles WHERE user_id = $1`, [quizUser_id]);
        await dataSource.query(`DELETE FROM users WHERE id = $1`, [quizUser_id]);
      }
    });

    it('GET /compatibility-quiz/questions returns seeded questions', async () => {
      const res = await request(app.getHttpServer())
        .get('/compatibility-quiz/questions')
        .set('Authorization', `Bearer ${quizUser_token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const firstQ = res.body[0];
      expect(firstQ).toHaveProperty('id');
      expect(firstQ).toHaveProperty('questionText');
      expect(firstQ).toHaveProperty('questionType');

      questionId = firstQ.id;
      optionId = firstQ.options?.[0]?.id;
    });

    it('POST /compatibility-quiz/responses saves a single-choice response', async () => {
      // Only proceed if the question has options (single_choice type)
      if (!optionId) {
        console.warn('Skipping: No option found on seeded question');
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/compatibility-quiz/responses')
        .set('Authorization', `Bearer ${quizUser_token}`)
        .send({
          questionId,
          optionIds: [optionId],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.questionId).toBe(questionId);
    });

    it('POST /compatibility-quiz/responses is idempotent (re-saving overwrites)', async () => {
      if (!optionId) return;

      // Submit again for the same question — should NOT fail with a unique-constraint error
      const res = await request(app.getHttpServer())
        .post('/compatibility-quiz/responses')
        .set('Authorization', `Bearer ${quizUser_token}`)
        .send({
          questionId,
          optionIds: [optionId],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('POST /compatibility-quiz/responses rejects invalid payload (no questionId)', async () => {
      await request(app.getHttpServer())
        .post('/compatibility-quiz/responses')
        .set('Authorization', `Bearer ${quizUser_token}`)
        .send({ optionIds: [optionId] }) // missing questionId
        .expect(400);
    });

    it('GET /compatibility-quiz/questions is protected (no token -> 401)', async () => {
      await request(app.getHttpServer())
        .get('/compatibility-quiz/questions')
        .expect(401);
    });
  });
});

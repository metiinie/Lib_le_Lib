import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ReportCategory,
  ReportSeverity,
} from '../src/moderation/entities/report.entity';
import { ModerationActionType } from '../src/moderation/entities/moderation-action.entity';

describe('Safety & Trust (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  let memberAId: string;
  let memberBId: string;
  let moderatorId: string;
  let memberAToken: string;
  let memberBToken: string;
  let modToken: string;
  let matchId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);

    // Clean up any stale state from previous failed runs
    const phones = ['+15550006661', '+15550006662', '+15550006663'];
    const staleUsers = await dataSource.query(
      'SELECT id FROM users WHERE phone = ANY($1)',
      [phones],
    );
    if (staleUsers.length > 0) {
      const staleIds = staleUsers.map((u: any) => u.id);
      await dataSource.query(
        'DELETE FROM audit_logs WHERE target_id = ANY($1) OR actor_id = ANY($1)',
        [staleIds],
      );
      await dataSource.query(
        'DELETE FROM moderation_actions WHERE target_user_id = ANY($1)',
        [staleIds],
      );
      await dataSource.query(
        'DELETE FROM reports WHERE reported_id = ANY($1) OR reporter_id = ANY($1)',
        [staleIds],
      );
      await dataSource.query(
        'DELETE FROM blocks WHERE blocker_id = ANY($1) OR blocked_id = ANY($1)',
        [staleIds],
      );
      await dataSource.query(
        'DELETE FROM matches WHERE user_a_id = ANY($1) OR user_b_id = ANY($1)',
        [staleIds],
      );
      await dataSource.query('DELETE FROM profiles WHERE user_id = ANY($1)', [
        staleIds,
      ]);
      await dataSource.query('DELETE FROM users WHERE phone = ANY($1)', [
        phones,
      ]);
    }

    // Create 3 users (2 members, 1 moderator)
    const usersInsert = await dataSource.query(`
      INSERT INTO users (phone, role, status) VALUES 
      ('+15550006661', 'member', 'active'),
      ('+15550006662', 'member', 'active'),
      ('+15550006663', 'moderator', 'active')
      RETURNING id, role
    `);

    memberAId = usersInsert[0].id;
    memberBId = usersInsert[1].id;
    moderatorId = usersInsert[2].id;

    // Profiles
    await dataSource.query(
      `
      INSERT INTO profiles (user_id, nickname, date_of_birth, gender) VALUES 
      ($1, 'Alice', '1990-01-01', 'woman'),
      ($2, 'Bob', '1991-01-01', 'man'),
      ($3, 'Mod', '1980-01-01', 'other')
    `,
      [memberAId, memberBId, moderatorId],
    );

    // Create Match between A and B
    const matchInsert = await dataSource.query(
      `
      INSERT INTO matches (user_a_id, user_b_id, status) VALUES 
      ($1, $2, 'active')
      RETURNING id
    `,
      [
        memberAId < memberBId ? memberAId : memberBId,
        memberAId < memberBId ? memberBId : memberAId,
      ],
    );
    matchId = matchInsert[0].id;

    memberAToken = jwtService.sign({ sub: memberAId, role: 'member' });
    memberBToken = jwtService.sign({ sub: memberBId, role: 'member' });
    modToken = jwtService.sign({ sub: moderatorId, role: 'moderator' });
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(
          'DELETE FROM audit_logs WHERE target_id IN ($1, $2, $3) OR actor_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM moderation_actions WHERE target_user_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM reports WHERE reported_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM blocks WHERE blocker_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM matches WHERE user_a_id IN ($1, $2, $3) OR user_b_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM profiles WHERE user_id IN ($1, $2, $3)',
          [memberAId, memberBId, moderatorId],
        );
        await dataSource.query(
          'DELETE FROM users WHERE phone IN ($1, $2, $3)',
          ['+15550006661', '+15550006662', '+15550006663'],
        );
      }
    } catch (e) {
      console.error('Teardown cleanup error:', e);
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  describe('Block Visibility', () => {
    it('A blocks B', async () => {
      const response = await request(app.getHttpServer())
        .post('/blocks')
        .set('Authorization', `Bearer ${memberAToken}`)
        .send({ blockedId: memberBId })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('B cannot message A', async () => {
      const response = await request(app.getHttpServer())
        .post(`/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${memberBToken}`)
        .send({
          messageType: 'text',
          ciphertext: 'Y2lwaGVy', // base64 'cipher'
          nonce: 'bm9uY2U=', // base64 'nonce'
        })
        .expect(403);

      expect(response.body.message).toContain('This match is unavailable');
    });

    it('A cannot message B', async () => {
      await request(app.getHttpServer())
        .post(`/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${memberAToken}`)
        .send({
          messageType: 'text',
          ciphertext: 'Y2lwaGVy',
          nonce: 'bm9uY2U=',
        })
        .expect(403);
    });

    it('B is invisible in A discovery feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/discovery')
        .set('Authorization', `Bearer ${memberAToken}`)
        .expect(200);

      const foundB = response.body.find((p: any) => p.userId === memberBId);
      expect(foundB).toBeUndefined();
    });

    it('A is invisible in B discovery feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/discovery')
        .set('Authorization', `Bearer ${memberBToken}`)
        .expect(200);

      const foundA = response.body.find((p: any) => p.userId === memberAId);
      expect(foundA).toBeUndefined();
    });

    it('B is invisible in A match list', async () => {
      const response = await request(app.getHttpServer())
        .get('/matches')
        .set('Authorization', `Bearer ${memberAToken}`)
        .expect(200);

      const matchWithB = response.body.find((m: any) => m.userId === memberBId);
      expect(matchWithB).toBeUndefined();
    });

    it('A is invisible in B match list', async () => {
      const response = await request(app.getHttpServer())
        .get('/matches')
        .set('Authorization', `Bearer ${memberBToken}`)
        .expect(200);

      const matchWithA = response.body.find((m: any) => m.userId === memberAId);
      expect(matchWithA).toBeUndefined();
    });

    it('A unblocks B', async () => {
      const blocks = await dataSource.query(
        'SELECT id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
        [memberAId, memberBId],
      );
      const blockId = blocks[0].id;

      await request(app.getHttpServer())
        .delete(`/blocks/${blockId}`)
        .set('Authorization', `Bearer ${memberAToken}`)
        .expect(204);

      // B can message A again
      await request(app.getHttpServer())
        .post(`/matches/${matchId}/messages`)
        .set('Authorization', `Bearer ${memberBToken}`)
        .send({
          messageType: 'text',
          ciphertext: 'Y2lwaGVy',
          nonce: 'bm9uY2U=',
        })
        .expect(201);

      // Verify B is back in A match list
      const matchesResponse = await request(app.getHttpServer())
        .get('/matches')
        .set('Authorization', `Bearer ${memberAToken}`)
        .expect(200);

      const matchWithB = matchesResponse.body.find(
        (m: any) => m.userId === memberBId,
      );
      expect(matchWithB).toBeDefined();
    });
  });

  describe('Reporting & Moderation', () => {
    let reportId: string;

    it('A reports B', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${memberAToken}`)
        .send({
          reportedId: memberBId,
          matchId: matchId,
          category: ReportCategory.HARASSMENT,
          description: 'Being mean',
        })
        .expect(201);

      reportId = response.body.id;
      expect(reportId).toBeDefined();
    });

    it('Moderator fetches report queue', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${modToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].id).toBe(reportId);
      expect(response.body.data[0].severity).toBe(ReportSeverity.MEDIUM); // HARASSMENT is MEDIUM
      expect(response.body.data[0].status).toBe('open');
    });

    it('Moderator bans B', async () => {
      const response = await request(app.getHttpServer())
        .post(`/reports/${reportId}/actions`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({
          action: ModerationActionType.BAN,
          reason: 'Severe violation',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('B is banned and audit log is written', async () => {
      // 1. Check user status
      const userB = await dataSource.query(
        'SELECT status FROM users WHERE id = $1',
        [memberBId],
      );
      expect(userB[0].status).toBe('banned');

      // 2. Check report status
      const report = await dataSource.query(
        'SELECT status FROM reports WHERE id = $1',
        [reportId],
      );
      expect(report[0].status).toBe('resolved');

      // 3. Check audit log
      const audit = await dataSource.query(
        'SELECT * FROM audit_logs WHERE target_id = $1 ORDER BY created_at DESC LIMIT 1',
        [memberBId],
      );
      expect(audit.length).toBe(1);
      expect(audit[0].actor_id).toBe(moderatorId);
      expect(audit[0].action).toBe('moderation_action_ban');
      expect(audit[0].target_type).toBe('user');
      expect(audit[0].metadata.reason).toBe('Severe violation');
    });
  });
});

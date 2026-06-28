import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../src/users/repositories/users.repository';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('OTP Flow', () => {
    const testPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
    let validOtpCode = '';

    it('/auth/otp/request (POST) - rate limits after 5 requests', async () => {
      // Send 5 requests
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/otp/request')
          .send({ destination: testPhone, isSignUp: true })
          .expect(200);
      }

      // The 6th should fail with 429 or 400 (we threw BadRequestException with code OTP_RATE_LIMITED)
      const res = await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ destination: testPhone, isSignUp: true })
        .expect(400);

      expect(res.body.error.code).toEqual('OTP_RATE_LIMITED');
    });

    it('/auth/otp/request (POST) - rejects duplicate phone at signup', async () => {
      const duplicatePhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ destination: duplicatePhone, isSignUp: true })
        .expect(200);

      // Now we need the code to verify. Since this is an e2e test hitting a real DB without mocking crypto,
      // we can't easily guess the code. Let's just create the user directly via the testing module if we need to.
      // Wait, we can test it differently. If we create a user, then try to signup. Let's use the DB directly.
      const usersRepo = app.get(UsersRepository);
      await usersRepo.createFromDestination(duplicatePhone);

      // Try to sign up again
      const res = await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ destination: duplicatePhone, isSignUp: true })
        .expect(409);

      expect(res.body.error.code).toEqual('USER_ALREADY_EXISTS');
    });

    it('/auth/otp/request (POST) - rejects login for non-existent phone', async () => {
      const ghostPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
      const res = await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ destination: ghostPhone, isSignUp: false })
        .expect(404);

      expect(res.body.error.code).toEqual('USER_NOT_FOUND');
    });

    it('/auth/otp/verify (POST) - fails with invalid code', async () => {
      const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ destination: testEmail, isSignUp: true })
        .expect(200);

      // Verify with invalid code
      const res = await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ destination: testEmail, code: '000000', isSignUp: true })
        .expect(401);

      expect(res.body.error.code).toEqual('OTP_INVALID');
    });

    it('Protected route rejects missing token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('Protected route rejects expired token', async () => {
      const jwtService = app.get(JwtService);
      const expiredToken = jwtService.sign({ sub: 'some-uuid', role: 'member' }, { expiresIn: '-1h', secret: 'test_jwt_secret_do_not_use_in_prod' });

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});

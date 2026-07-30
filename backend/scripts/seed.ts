import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Region } from '../src/profiles/entities/region.entity';
import { InterestTag } from '../src/profiles/entities/interest-tag.entity';
import { User } from '../src/users/entities/user.entity';
import { Profile } from '../src/profiles/entities/profile.entity';
import { Photo } from '../src/photos/entities/photo.entity';
import { QuizQuestion } from '../src/compatibility-quiz/entities/quiz-question.entity';
import { QuizOption } from '../src/compatibility-quiz/entities/quiz-option.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);
  
  console.log('🌱 Starting database seed...');
  
  // 1. Seed Ethiopian Regions
  console.log('Seeding regions...');
  const regionsRepo = dataSource.getRepository(Region);
  const ethiopianRegions = [
    { countryCode: 'ET', name: 'Addis Ababa' },
    { countryCode: 'ET', name: 'Oromia' },
    { countryCode: 'ET', name: 'Amhara' },
    { countryCode: 'ET', name: 'Tigray' },
    { countryCode: 'ET', name: 'Sidama' },
    { countryCode: 'ET', name: 'Somali' },
    { countryCode: 'ET', name: 'Dire Dawa' },
  ];
  
  
  for (const r of ethiopianRegions) {
    const exists = await regionsRepo.findOneBy({ name: r.name, countryCode: r.countryCode });
    if (!exists) {
      await regionsRepo.save(r);
    }
  }

  // 2. Seed Interest Tags
  console.log('Seeding interest tags...');
  const tagsRepo = dataSource.getRepository(InterestTag);
  const commonTags = [
    'Coffee', 'Hiking', 'Music', 'Reading', 'Travel', 'Movies', 
    'Technology', 'Art', 'Sports', 'Cooking'
  ];
  
  for (const tagName of commonTags) {
    const exists = await tagsRepo.findOneBy({ name: tagName });
    if (!exists) {
      await tagsRepo.save({ name: tagName });
    }
  }
  
  const savedTags = await tagsRepo.find();
  const savedRegions = await regionsRepo.find();
  
  if (savedRegions.length === 0) {
    throw new Error('No regions found to attach to profiles.');
  }

  // 3. Seed Quiz Questions
  console.log('Seeding compatibility quiz questions...');
  const questionsRepo = dataSource.getRepository(QuizQuestion);
  const optionsRepo = dataSource.getRepository(QuizOption);
  
  const quizData = [
    {
      questionText: 'How important is regular communication to you?',
      questionType: 'single_choice',
      orderIndex: 1,
      options: ['Very important', 'Somewhat important', 'Not very important', 'I prefer lots of space']
    },
    {
      questionText: 'What is your ideal weekend?',
      questionType: 'single_choice',
      orderIndex: 2,
      options: ['Staying in and relaxing', 'Going out with friends', 'Outdoor adventure', 'Working on personal projects']
    },
    {
      questionText: 'How do you handle conflict?',
      questionType: 'single_choice',
      orderIndex: 3,
      options: ['Discuss immediately', 'Take time to process first', 'Avoid it if possible', 'Seek mediation']
    }
  ];

  for (const q of quizData) {
    const existingQ = await questionsRepo.findOneBy({ questionText: q.questionText });
    if (!existingQ) {
      const savedQ = await questionsRepo.save({
        questionText: q.questionText,
        questionType: q.questionType,
        orderIndex: q.orderIndex,
        active: true
      });
      
      for (let i = 0; i < q.options.length; i++) {
        await optionsRepo.save({
          question: savedQ,
          optionText: q.options[i],
          orderIndex: i + 1
        });
      }
    }
  }

  // 4. Seed Role-based Test Users
  console.log('Seeding role-based test users...');
  const usersRepo = dataSource.getRepository(User);
  const profilesRepo = dataSource.getRepository(Profile);
  const photosRepo = dataSource.getRepository(Photo);
  const crypto = await import('crypto');

  const passwordHash = crypto.createHash('sha256').update('@Hiv1234').digest('hex');

  const roleTestUsers = [
    {
      email: 'member@gmail.com',
      phone: '+251911000001',
      role: 'member' as const,
      status: 'active' as const,
      nickname: 'Abebe',
      gender: 'man',
      dob: '1995-01-01',
      bio: 'Regular member profile for discovery & matching.',
    },
    {
      email: 'officer@gmail.com',
      phone: '+251911000002',
      role: 'verification_officer' as const,
      status: 'active' as const,
      nickname: 'Officer',
      gender: 'man',
      dob: '1990-05-10',
      bio: 'Verification officer account for ID & selfie reviews.',
    },
    {
      email: 'mod@gmail.com',
      phone: '+251911000003',
      role: 'moderator' as const,
      status: 'active' as const,
      nickname: 'Moderator',
      gender: 'woman',
      dob: '1992-08-15',
      bio: 'Safety & moderation manager for reports.',
    },
    {
      email: 'doc@gmail.com',
      phone: '+251911000004',
      role: 'health_professional' as const,
      status: 'active' as const,
      nickname: 'Doctor',
      gender: 'man',
      dob: '1985-03-20',
      bio: 'Verified healthcare provider for Q&A threads.',
    },
    {
      email: 'admin@gmail.com',
      phone: '+251911000005',
      role: 'admin' as const,
      status: 'active' as const,
      nickname: 'Admin',
      gender: 'woman',
      dob: '1988-12-01',
      bio: 'Platform administrator with full surface access.',
    },
  ];

  for (const t of roleTestUsers) {
    let user = await usersRepo.findOneBy({ email: t.email });
    if (!user) {
      user = await usersRepo.save({
        email: t.email,
        phone: t.phone,
        role: t.role,
        status: t.status,
        passwordHash,
      });

      await profilesRepo.save({
        userId: user.id,
        nickname: t.nickname,
        dateOfBirth: t.dob,
        gender: t.gender,
        regionId: savedRegions[Math.floor(Math.random() * savedRegions.length)].id,
        relationshipGoals: ['serious_relationship'],
        bio: t.bio,
        interestTags: [savedTags[Math.floor(Math.random() * savedTags.length)]],
      });

      await photosRepo.save({
        profileId: user.id,
        storageRef: 'test-photo-ref_original.jpg',
        isPrimary: true,
        blurredDefault: true,
      });
    } else {
      // Update role/password/phone/status if user already exists
      user.phone = t.phone;
      user.role = t.role;
      user.status = t.status;
      user.passwordHash = passwordHash;
      await usersRepo.save(user);
    }
  }

  console.log('✅ Seeding complete!');
  await app.close();
  process.exit(0);
}

bootstrap();

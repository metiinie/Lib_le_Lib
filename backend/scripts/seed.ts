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

  // 4. Seed Test Users
  console.log('Seeding test users & profiles...');
  const usersRepo = dataSource.getRepository(User);
  const profilesRepo = dataSource.getRepository(Profile);
  const photosRepo = dataSource.getRepository(Photo);
  
  const testUsers = [
    { phone: '+251911111111', nickname: 'Abebe', gender: 'man', dob: '1995-01-01' },
    { phone: '+251922222222', nickname: 'Chaltu', gender: 'woman', dob: '1996-05-15' },
    { phone: '+251933333333', nickname: 'Dawit', gender: 'man', dob: '1990-11-20' },
    { phone: '+251944444444', nickname: 'Eyerusalem', gender: 'woman', dob: '1998-03-10' },
    { phone: '+251955555555', nickname: 'Mekdes', gender: 'woman', dob: '1994-07-22' },
  ];
  
  for (const t of testUsers) {
    let user = await usersRepo.findOneBy({ phone: t.phone });
    if (!user) {
      user = await usersRepo.save({
        phone: t.phone,
        status: 'active', // Pre-verified
      });
      
      const profile = await profilesRepo.save({
        userId: user.id,
        nickname: t.nickname,
        dateOfBirth: t.dob,
        gender: t.gender,
        regionId: savedRegions[Math.floor(Math.random() * savedRegions.length)].id,
        relationshipGoals: ['serious_relationship'],
        bio: `Hello! I am ${t.nickname}. Looking forward to connecting.`,
        interestTags: [savedTags[Math.floor(Math.random() * savedTags.length)]],
      });
      
      await photosRepo.save({
        profileId: user.id,
        storageRef: 'test-photo-ref_original.jpg',
        isPrimary: true,
        blurredDefault: true,
      });
    }
  }

  console.log('✅ Seeding complete!');
  await app.close();
  process.exit(0);
}

bootstrap();

const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:1832@localhost:5555/lib_le_lib?schema=public',
});
ds.initialize().then(async () => {
  try {
    const qb = ds.createQueryBuilder()
      .select([
        's.target_id as "id"',
        'p.nickname as "nickname"',
        'EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth))::int as "age"',
        'p.region as "region"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
        's.created_at as "likedAt"',
      ])
      .from('swipes', 's')
      .innerJoin('profiles', 'p', 'p.user_id = s.target_id')
      .leftJoin('photos', 'ph', 'ph.profile_id = s.target_id AND ph.is_primary = true')
      .where('s.actor_id = :userId', { userId: '11111111-1111-1111-1111-111111111111' })
      .andWhere('s.action = :action', { action: 'like' });
    const res = await qb.getRawMany();
    console.log('OK', res);
  } catch(e) {
    console.error('ERROR', e.message);
  } finally {
    await ds.destroy();
  }
});

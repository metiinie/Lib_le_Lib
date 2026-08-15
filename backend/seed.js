const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:1832@localhost:5555/lib_le_lib?schema=public'
});
const regions = [
  { n: 'Addis Ababa', c: 'ET' },
  { n: 'Dire Dawa', c: 'ET' },
  { n: 'Oromia', c: 'ET' },
  { n: 'Amhara', c: 'ET' },
  { n: 'Tigray', c: 'ET' },
  { n: 'SNNPR', c: 'ET' },
  { n: 'Sidama', c: 'ET' },
  { n: 'Somali', c: 'ET' },
  { n: 'Afar', c: 'ET' },
  { n: 'Benishangul-Gumuz', c: 'ET' },
  { n: 'Gambela', c: 'ET' },
  { n: 'Harari', c: 'ET' },
  { n: 'SWEPR', c: 'ET' },
  { n: 'Maekel / Central', c: 'ER' },
  { n: 'Anseba', c: 'ER' },
  { n: 'Gash-Barka', c: 'ER' },
  { n: 'Debub / Southern', c: 'ER' },
  { n: 'Northern Red Sea', c: 'ER' },
  { n: 'Southern Red Sea', c: 'ER' }
];
client.connect().then(async () => {
  try {
    for (const r of regions) {
      await client.query('INSERT INTO regions (name, country_code) VALUES ($1, $2)', [r.n, r.c]);
    }
    console.log('Regions seeded successfully');
  } catch (e) {
    console.error(e);
  } finally {
    client.end();
  }
});

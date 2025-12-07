import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const inspectorPasswordHash = await bcrypt.hash('inspecteur123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elektroinspect.nl' },
    update: {},
    create: {
      email: 'admin@elektroinspect.nl',
      password: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'ElektroInspect',
      role: 'ADMIN',
      companyName: 'ElektroInspect BV',
      phoneNumber: '+31 20 1234567',
      active: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create inspector user
  const inspector = await prisma.user.upsert({
    where: { email: 'inspecteur@elektroinspect.nl' },
    update: {},
    create: {
      email: 'inspecteur@elektroinspect.nl',
      password: inspectorPasswordHash,
      firstName: 'Jan',
      lastName: 'de Vries',
      role: 'INSPECTOR',
      companyName: 'ElektroInspect BV',
      phoneNumber: '+31 6 12345678',
      active: true,
    },
  });
  console.log('Created inspector user:', inspector.email);

  // Create a sample inspection template with nested components
  const template = await prisma.inspectionTemplate.create({
    data: {
      name: 'Elektrische Installatie Woning - Basis Inspectie',
      description: 'Standaard inspectie template voor elektrische installaties in woningen volgens NEN 1010',
      installationType: 'woning',
      active: true,
      mainComponents: {
        create: [
          {
            name: 'Meterkast',
            description: 'Inspectie van de meterkast en hoofdschakelaar',
            sortOrder: 1,
            subComponents: {
              create: [
                {
                  name: 'Hoofdschakelaar',
                  criterion: 'Hoofdschakelaar aanwezig en toegankelijk',
                  expectedOutcome: 'Hoofdschakelaar is aanwezig, goed bereikbaar en functioneert correct',
                  sortOrder: 1,
                  requiresPhoto: true,
                },
                {
                  name: 'Aardlekschakelaar',
                  criterion: 'Aardlekschakelaar (30mA) aanwezig voor groepen',
                  expectedOutcome: 'Minimaal één 30mA aardlekschakelaar aanwezig voor alle stopcontactgroepen',
                  sortOrder: 2,
                  requiresPhoto: true,
                },
                {
                  name: 'Automaten',
                  criterion: 'Juiste amperage automaten per groep',
                  expectedOutcome: 'Lichtgroepen 10A/16A, stopcontacten 16A/20A, kookgroep 20A/25A',
                  sortOrder: 3,
                  requiresPhoto: false,
                },
                {
                  name: 'Beschriftingen',
                  criterion: 'Groepen zijn duidelijk beschreven',
                  expectedOutcome: 'Alle groepen hebben een duidelijke en actuele beschrijving',
                  sortOrder: 4,
                  requiresPhoto: false,
                },
                {
                  name: 'Kabeldoorvoeren',
                  criterion: 'Doorvoeren zijn netjes en afgedicht',
                  expectedOutcome: 'Geen ongebruikte doorvoeren, alle doorvoeren zijn afgedicht',
                  sortOrder: 5,
                  requiresPhoto: false,
                },
              ],
            },
          },
          {
            name: 'Aarding en Equipotentiaal',
            description: 'Controle van aarding en equipotentiaal verbindingen',
            sortOrder: 2,
            subComponents: {
              create: [
                {
                  name: 'Aardingselectrode',
                  criterion: 'Aardingselectrode aanwezig en bereikbaar',
                  expectedOutcome: 'Aardingselectrode is aanwezig, zichtbaar en correct aangesloten',
                  sortOrder: 1,
                  requiresPhoto: true,
                },
                {
                  name: 'Hoofdaardklem',
                  criterion: 'Hoofdaardklem aanwezig',
                  expectedOutcome: 'Hoofdaardklem is aanwezig en correct aangesloten',
                  sortOrder: 2,
                  requiresPhoto: false,
                },
                {
                  name: 'Equipotentiaal badkamer',
                  criterion: 'Equipotentiaal verbinding in badkamer',
                  expectedOutcome: 'Alle metalen leidingen zijn verbonden met equipotentiaal',
                  sortOrder: 3,
                  requiresPhoto: true,
                },
                {
                  name: 'Metalen waterleiding',
                  criterion: 'Waterleiding geaard binnen 60cm van entree',
                  expectedOutcome: 'Metalen waterleiding is geaard binnen 60cm na binnenkomst',
                  sortOrder: 4,
                  requiresPhoto: false,
                },
              ],
            },
          },
          {
            name: 'Stopcontacten',
            description: 'Controle van stopcontacten in de woning',
            sortOrder: 3,
            subComponents: {
              create: [
                {
                  name: 'Randaarde stopcontacten',
                  criterion: 'Alle stopcontacten voorzien van randaarde',
                  expectedOutcome: 'Alle stopcontacten hebben randaarde aansluiting',
                  sortOrder: 1,
                  requiresPhoto: false,
                },
                {
                  name: 'Montage stopcontacten',
                  criterion: 'Stopcontacten zijn deugdelijk gemonteerd',
                  expectedOutcome: 'Stopcontacten zitten stevig vast, niet los of beschadigd',
                  sortOrder: 2,
                  requiresPhoto: false,
                },
                {
                  name: 'Badkamer zones',
                  criterion: 'Stopcontacten in juiste zones badkamer',
                  expectedOutcome: 'Geen stopcontacten in zone 0, 1 en 2; zone 3 alleen met aardlekbeveiliging',
                  sortOrder: 3,
                  requiresPhoto: true,
                },
                {
                  name: 'Buitenstopcontacten',
                  criterion: 'Buitenstopcontacten spatwaterdicht (IP44)',
                  expectedOutcome: 'Alle buitenstopcontacten zijn minimaal IP44 en achter aardlek',
                  sortOrder: 4,
                  requiresPhoto: true,
                },
              ],
            },
          },
          {
            name: 'Verlichting',
            description: 'Controle van verlichtingsinstallatie',
            sortOrder: 4,
            subComponents: {
              create: [
                {
                  name: 'Armaturen badkamer',
                  criterion: 'Armaturen geschikt voor natte ruimte',
                  expectedOutcome: 'Armaturen in badkamer zijn spatwaterdicht (minimaal IP44)',
                  sortOrder: 1,
                  requiresPhoto: false,
                },
                {
                  name: 'Buitenverlichting',
                  criterion: 'Buitenverlichting spatwaterdicht',
                  expectedOutcome: 'Buitenverlichting minimaal IP44, deugdelijk gemonteerd',
                  sortOrder: 2,
                  requiresPhoto: false,
                },
                {
                  name: 'Fitting en bedrading',
                  criterion: 'Fittingen en bedrading in goede staat',
                  expectedOutcome: 'Geen beschadigde fittingen, bedrading niet zichtbaar',
                  sortOrder: 3,
                  requiresPhoto: false,
                },
              ],
            },
          },
          {
            name: 'Vaste Apparaten',
            description: 'Controle van vaste elektrische apparaten',
            sortOrder: 5,
            subComponents: {
              create: [
                {
                  name: 'Kookplaat aansluiting',
                  criterion: 'Kookplaat correct aangesloten',
                  expectedOutcome: 'Kookplaat aangesloten op eigen groep met juiste beveiliging',
                  sortOrder: 1,
                  requiresPhoto: false,
                },
                {
                  name: 'Boiler aansluiting',
                  criterion: 'Boiler correct aangesloten en beveiligd',
                  expectedOutcome: 'Boiler op eigen groep, juiste kabeldikte en beveiliging',
                  sortOrder: 2,
                  requiresPhoto: false,
                },
                {
                  name: 'CV-ketel aansluiting',
                  criterion: 'CV-ketel correct aangesloten',
                  expectedOutcome: 'CV-ketel volgens voorschriften aangesloten met juiste beveiliging',
                  sortOrder: 3,
                  requiresPhoto: false,
                },
                {
                  name: 'Rookmelder voeding',
                  criterion: 'Rookmelders op netvoeding of 10-jaar batterij',
                  expectedOutcome: 'Alle rookmelders hebben adequate voeding volgens bouwbesluit',
                  sortOrder: 4,
                  requiresPhoto: false,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      mainComponents: {
        include: {
          subComponents: true,
        },
      },
    },
  });

  console.log('Created inspection template:', template.name);
  console.log(`  - Main components: ${template.mainComponents.length}`);
  console.log(
    `  - Total sub-components: ${template.mainComponents.reduce(
      (sum, mc) => sum + mc.subComponents.length,
      0
    )}`
  );

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

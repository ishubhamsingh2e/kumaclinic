import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addTeamPermissions() {
  const permissions = [
    { name: 'team:read', description: 'View team members and invitations' },
    { name: 'team:invite', description: 'Invite new users to the team' },
    { name: 'team:manage', description: 'Change roles and remove team members' },
    { name: 'team:transfer_ownership', description: 'Transfer clinic ownership' },
  ];

  console.log('Adding team permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    console.log('✓', perm.name);
  }
  
  console.log('\nAssigning permissions to roles...');
  
  const roles = await prisma.role.findMany();
  
  for (const role of roles) {
    const permissionsToAdd = [];
    
    permissionsToAdd.push('team:read');
    
    if (role.name === 'CLINIC_MANAGER' || role.name === 'ADMIN') {
      permissionsToAdd.push('team:invite', 'team:manage');
    }
    
    if (role.name === 'ADMIN') {
      permissionsToAdd.push('team:transfer_ownership');
    }
    
    const perms = await prisma.permission.findMany({
      where: { name: { in: permissionsToAdd } },
    });
    
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: perms.map(p => ({ id: p.id })),
        },
      },
    });
    
    console.log(`✓ ${role.name}: ${permissionsToAdd.join(', ')}`);
  }
  
  await prisma.$disconnect();
  console.log('\n✅ Done!');
}

addTeamPermissions().catch(console.error);

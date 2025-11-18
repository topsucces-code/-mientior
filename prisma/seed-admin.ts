import { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { getPermissionsForRole } from '../src/lib/rbac';

async function seedAdmin() {
  console.log('🌱 Seeding admin user...');

  const email = process.env.ADMIN_DEFAULT_EMAIL || 'admin@mientior.com';
  const firstName = 'Super';
  const lastName = 'Admin';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.isActive ? 'Active' : 'Inactive'}`);
      return;
    }

    // Get all permissions for SUPER_ADMIN role
    const permissions = getPermissionsForRole(Role.SUPER_ADMIN);

    // Create the admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        email,
        firstName,
        lastName,
        role: Role.SUPER_ADMIN,
        permissions: permissions as any,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Permissions: ${permissions.length} permissions granted`);
    console.log('');
    console.log('⚠️  IMPORTANT: Make sure to create a user account with this email in Better Auth');
    console.log(`   You can sign up at: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/auth/sign-up`);
    console.log(`   Or use the Better Auth API to create the user programmatically`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAdmin()
  .then(() => {
    console.log('🎉 Admin seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  });

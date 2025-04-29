import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// EDIT THESE VALUES to create a new user
// You can modify these values any time you want to create a new user
const userToCreate = {
  name: 'Consultant Demo',
  email: 'consultant@office-pilot.com',
  password: 'Consultant@123',
  role: 'BUSINESS_CONSULTANT' as UserRole,  // Options: ADMIN, PARTNER, BUSINESS_EXECUTIVE, BUSINESS_CONSULTANT, PERMANENT_CLIENT, GUEST_CLIENT
  isActive: true
};

async function main() {
  console.log('Starting user creation...');
  
  // Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userToCreate.email.toLowerCase() }
  });
  
  if (existingUser) {
    console.log(`⚠️ User with email ${userToCreate.email} already exists.`);
    console.log('If you want to create a new user, change the email address in the script.');
    return;
  }
  
  // Hash the password
  const hashedPassword = await hash(userToCreate.password, 12);
  
  // Create the user
  await prisma.user.create({
    data: {
      id: uuidv4(),
      name: userToCreate.name,
      email: userToCreate.email.toLowerCase(),
      password: hashedPassword,
      role: userToCreate.role,
      isActive: userToCreate.isActive,
      canApproveBilling: userToCreate.role === 'ADMIN' || userToCreate.role === 'PARTNER'
    }
  });
  
  console.log(`✅ Successfully created ${userToCreate.role} account:`);
  console.log(`   Name: ${userToCreate.name}`);
  console.log(`   Email: ${userToCreate.email}`);
  console.log(`   Role: ${userToCreate.role}`);
}

main()
  .catch(e => {
    console.error('Error during user creation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Use CommonJS syntax
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')

const prismaClient = new PrismaClient()

async function main() {
  try {
    // Create the admin user
    const adminUser = await prismaClient.user.create({
      data: {
        id: uuidv4(),
        name: "Sahil Vishwakarma",
        email: "sahilvishwa2108@gmail.com",
        role: "ADMIN",
        // Note: Leave clerkId as null for now since we'll create the Clerk user separately
      },
    })

    console.log(`Created admin user: ${adminUser.name} with id: ${adminUser.id}`)
    console.log('Please sign up on Clerk with email:', adminUser.email)
    console.log('After signing up, update the user in Clerk with role "ADMIN" in their metadata')
    console.log('Remember to update the clerkId in your database after creating the Clerk user')
  } catch (error) {
    // Check for duplicate error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.log('Admin user already exists in the database')
    } else {
      console.error('Error creating admin user:', error)
    }
  }
}

main()
  .then(async () => {
    await prismaClient.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prismaClient.$disconnect()
    process.exit(1)
  })
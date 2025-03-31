// Use CommonJS syntax
const { PrismaClient } = require('@prisma/client')
// If using custom output path, use: require('../generated/prisma')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = "sahilvishwa2108@gmail.com"
  const clerkId = process.argv[2]
  
  if (!clerkId) {
    console.error('Please provide Clerk ID as argument')
    process.exit(1)
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { clerkId },
    })

    console.log(`Updated admin user with Clerk ID: ${clerkId}`)
    console.log('Updated user details:', updatedUser)
  } catch (error) {
    console.error('Error updating admin user:', error)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
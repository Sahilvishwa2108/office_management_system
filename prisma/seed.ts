import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  // Check if admin already exists
  const adminExists = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  })

  if (!adminExists) {
    // Create default admin account
    const hashedPassword = await hash('Sahil@2002', 12) // Strong temporary password
    
    await prisma.user.create({
      data: {
        id: uuidv4(), // Use uuid package instead of crypto
        name: 'Sahil Vishwakarma',
        email: 'sahilvishwa2108@gmail.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('Default admin account created')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
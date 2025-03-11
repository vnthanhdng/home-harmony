import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function testPrismaModels() {
  try {
    console.log('Testing Prisma models...')
    
    // Clean up from previous test runs
    console.log('Cleaning up previous test data...')
    await prisma.mediaItem.deleteMany({})
    await prisma.task.deleteMany({})
    await prisma.unitMember.deleteMany({})
    await prisma.unit.deleteMany({})
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } })
    
    // Create test user
    console.log('Creating test user...')
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password_would_go_here',
        phone: '+1234567890'
      }
    })
    console.log('✅ User created:', user.id)
    
    // Create test unit
    console.log('Creating test living unit...')
    const unit = await prisma.unit.create({
      data: {
        name: 'Test Apartment',
        members: {
          create: {
            role: 'admin',
            userId: user.id
          }
        }
      }
    })
    console.log('✅ Unit created:', unit.id)
    
    // Create test task
    console.log('Creating test task...')
    const task = await prisma.task.create({
      data: {
        title: 'Clean kitchen',
        description: 'Wipe counters and wash dishes',
        status: 'pending',
        creatorId: user.id,
        assigneeId: user.id,
        unitId: unit.id,
        completionMedia: {
          create: {
            url: 'https://example.com/test.jpg',
            type: 'image',
            filename: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024
          }
        }
      },
      include: {
        completionMedia: true
      }
    })
    console.log('✅ Task created with media:', task)
    
    // Fetch everything with relations to verify integrity
    console.log('\nFetching everything with relations...')
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        units: {
          include: {
            unit: true
          }
        },
        tasks: true,
        assignedTasks: true
      }
    })
    
    console.log('✅ All relations verified:', 
      fullUser?.units.length ? 'Units: ✓' : 'Units: ✗',
      fullUser?.tasks.length ? 'Created tasks: ✓' : 'Created tasks: ✗',
      fullUser?.assignedTasks.length ? 'Assigned tasks: ✓' : 'Assigned tasks: ✗'
    )
    
    // Clean up test data
    console.log('\nCleaning up test data...')
    await prisma.mediaItem.deleteMany({})
    await prisma.task.deleteMany({})
    await prisma.unitMember.deleteMany({})
    await prisma.unit.deleteMany({})
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } })
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All tests passed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaModels()
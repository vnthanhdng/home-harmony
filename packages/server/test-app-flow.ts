import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import * as crypto from 'crypto'

dotenv.config()
const prisma = new PrismaClient()
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

async function testApplicationFlow() {
  try {
    console.log('Testing complete application flow...')
    
    // 1. Create a user
    const user = await prisma.user.create({
      data: {
        email: 'flowtest@example.com',
        username: 'flowtest',
        password: 'hashed_password_here',
        phone: '+9876543210'
      }
    })
    console.log('✅ Created user:', user.username)
    
    // 2. Create a household unit
    const unit = await prisma.unit.create({
      data: {
        name: 'Flow Test Apartment',
        members: {
          create: {
            role: 'admin',
            userId: user.id
          }
        }
      }
    })
    console.log('✅ Created unit:', unit.name)
    
    // 3. Create a test image file
    const testImageName = 'test-image.jpg'
    const testImageContent = crypto.randomBytes(1024) // Fake image content
    fs.writeFileSync(testImageName, testImageContent)
    
    // 4. Upload the test image to S3
    const s3Key = `test-flow/${user.id}/${Date.now()}-${testImageName}`
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      Body: fs.readFileSync(testImageName),
      ContentType: 'image/jpeg'
    }))
    console.log('✅ Uploaded test image to S3')
    
    // 5. Create a task with the image
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
    const task = await prisma.task.create({
      data: {
        title: 'Flow Test Task',
        description: 'Testing the complete application flow',
        status: 'completed',
        creatorId: user.id,
        assigneeId: user.id,
        unitId: unit.id,
        completionMedia: {
          create: {
            url: imageUrl,
            type: 'image',
            filename: testImageName,
            mimeType: 'image/jpeg',
            size: testImageContent.length
          }
        }
      },
      include: {
        completionMedia: true
      }
    })
    console.log('✅ Created task with media:', task.title)
    console.log('Media URL:', task.completionMedia[0].url)
    
    // 6. Verify everything is in place
    const verifiedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        units: { include: { unit: true } },
        tasks: { include: { completionMedia: true } }
      }
    })
    
    console.log('\n✅ Verification:')
    console.log(
      'User exists:', !!verifiedUser,
      'User in unit:', verifiedUser?.units.length ? 'Yes' : 'No',
      'User has task:', verifiedUser?.tasks.length ? 'Yes' : 'No',
      'Task has media:', verifiedUser?.tasks[0]?.completionMedia.length ? 'Yes' : 'No'
    )
    
    // 7. Clean up
    console.log('\nCleaning up test data...')
    await prisma.mediaItem.deleteMany({ where: { task: { creatorId: user.id } } })
    await prisma.task.deleteMany({ where: { creatorId: user.id } })
    await prisma.unitMember.deleteMany({ where: { userId: user.id } })
    await prisma.unit.deleteMany({ where: { id: unit.id } })
    await prisma.user.deleteMany({ where: { id: user.id } })
    fs.unlinkSync(testImageName)
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 Complete application flow test passed!')
    
  } catch (error) {
    console.error('❌ Application flow test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApplicationFlow()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as result;`
    console.log('✅ PostgreSQL connection successful!', result)
    
    // Get database information
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_schema, version();`
    console.log('Database info:', dbInfo)
    
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('Database test completed successfully')
    } else {
      console.log('Database test failed')
    }
  })
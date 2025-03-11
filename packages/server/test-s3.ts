import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const bucketName = process.env.S3_BUCKET_NAME!

async function testS3() {
  try {
    // Test 1: List buckets
    console.log('Testing ability to list buckets...')
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}))
    console.log('✅ Successfully connected to S3')
    console.log('Available buckets:', listBucketsResponse.Buckets?.map(b => b.Name))
    
    // Check if our bucket exists
    const bucketExists = listBucketsResponse.Buckets?.some(b => b.Name === bucketName)
    console.log(`${bucketExists ? '✅ Bucket exists' : '❌ Bucket not found'}: ${bucketName}`)

    // Test 2: Upload a test file
    console.log('\nTesting ability to upload a file...')
    const testFileName = 'test-file.txt'
    
    // Create a temporary test file
    fs.writeFileSync(testFileName, 'This is a test file for S3 upload testing')
    
    try {
      const fileContent = fs.readFileSync(testFileName)
      const uploadParams = {
        Bucket: bucketName,
        Key: 'test-uploads/test-file.txt',
        Body: fileContent,
        ContentType: 'text/plain'
      }
      
      await s3Client.send(new PutObjectCommand(uploadParams))
      console.log('✅ Successfully uploaded test file to S3')
      
      // Test 3: Generate a presigned URL
      console.log('\nTesting ability to generate a presigned URL...')
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'test-uploads/test-file.txt'
      })
      
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })
      console.log('✅ Successfully generated presigned URL:')
      console.log(presignedUrl)
      
      // Test 4: Clean up by deleting the test file
      console.log('\nCleaning up test file...')
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: 'test-uploads/test-file.txt'
      }))
      console.log('✅ Successfully deleted test file from S3')
      
    } catch (uploadError) {
      console.error('❌ S3 operation failed:', uploadError)
    }
    
    // Cleanup local test file
    fs.unlinkSync(testFileName)
    
  } catch (error) {
    console.error('❌ Error connecting to S3:', error)
  }
}

testS3()
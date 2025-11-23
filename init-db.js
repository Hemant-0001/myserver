const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing database...');
  
  // Create a test request to ensure the database is working
  const testRequest = await prisma.request.create({
    data: {
      method: 'TEST',
      url: '/test',
      headers: '{}',
      body: '{}',
      status: 'pending'
    }
  });
  
  console.log('Database initialized successfully!');
  console.log('Test request created with ID:', testRequest.id);
  
  // Clean up the test request
  await prisma.request.delete({
    where: {
      id: testRequest.id
    }
  });
  
  console.log('Test request cleaned up');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
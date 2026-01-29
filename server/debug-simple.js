const { scanRepositoryInput } = require('./src/services/repositoryService');

async function testSimpleRepo() {
  try {
    console.log('Testing with a simple, small GitHub repository...');
    // Using Microsoft's VSCode repository as it's known to exist
    const url = 'https://github.com/microsoft/TypeScript';
    
    console.log('Starting repository scan...');
    const result = await scanRepositoryInput(url);
    
    console.log('Scan successful!');
    console.log('Repository:', result.name);
    console.log('Total files:', result.totalFiles);
    console.log('Languages:', result.languages);
    
  } catch (error) {
    console.error('Error during repository scan:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleRepo();
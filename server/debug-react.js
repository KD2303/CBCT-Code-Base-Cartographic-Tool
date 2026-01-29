const { scanRepositoryInput } = require('./src/services/repositoryService');

async function testDifferentRepo() {
  try {
    console.log('Testing with a different GitHub repository...');
    const url = 'https://github.com/facebook/react';
    
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

testDifferentRepo();
const { scanRepositoryInput } = require('./src/services/repositoryService');

async function testGearGuardRepo() {
  try {
    console.log('Testing GearGuard repository...');
    const url = 'https://github.com/githubarin-art/GearGuard-The-Ultimate-Maintenance-Tracker';
    
    console.log('Starting repository scan...');
    const result = await scanRepositoryInput(url);
    
    console.log('Scan successful!');
    console.log('Repository:', result.name);
    console.log('Total files:', result.totalFiles);
    console.log('Languages:', result.languages);
    console.log('Structure:', Object.keys(result.structure || {}));
    
  } catch (error) {
    console.error('Error during repository scan:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGearGuardRepo();
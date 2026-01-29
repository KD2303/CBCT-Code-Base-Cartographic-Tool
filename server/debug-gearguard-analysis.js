const { scanRepositoryInput } = require('./src/services/repositoryService');
const { analyzeDependencies } = require('./src/services/analysisService');

async function testGearGuardAnalysis() {
  try {
    console.log('Testing GearGuard repository analysis...');
    const url = 'https://github.com/githubarin-art/GearGuard-The-Ultimate-Maintenance-Tracker';
    
    console.log('Step 1: Repository scan...');
    const scanResult = await scanRepositoryInput(url);
    console.log('✅ Scan successful:', scanResult.totalFiles, 'files');
    
    console.log('\nStep 2: Dependency analysis...');
    const analysisResult = await analyzeDependencies(scanResult.clonePath);
    console.log('✅ Analysis successful!');
    console.log('Nodes:', analysisResult.nodes?.length || 0);
    console.log('Edges:', analysisResult.edges?.length || 0);
    
  } catch (error) {
    console.error('❌ Error during analysis:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGearGuardAnalysis();
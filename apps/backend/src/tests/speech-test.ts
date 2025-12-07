/**
 * Manual test script for speech and communication analysis
 * Run with: npm run test:speech
 *
 * Make sure to set up your .env file first!
 */

import 'dotenv/config';
import { loadEnv } from '../config/index.js';
import { AzureSpeechAnalyzer } from '../infrastructure/speech/index.js';
import { OpenAICommunicationAnalyzer } from '../infrastructure/llm/index.js';
import { AnalysisService } from '../services/index.js';
import { logger } from '../shared/utils/logger.js';

async function testCommunicationAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Communication Analysis (OpenAI)');
  console.log('='.repeat(60) + '\n');

  const env = loadEnv();

  const analyzer = new OpenAICommunicationAnalyzer({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });

  // Check if ready
  const ready = await analyzer.isReady();
  console.log(`OpenAI service ready: ${ready}`);

  if (!ready) {
    console.log('OpenAI service not ready. Check your API key.');
    return;
  }

  // Test transcript (simulating non-native speaker)
  const testTranscript = `
    So basically um I've been working on the API integration this week
    and um it's going pretty well actually. We had some issues with the
    authentication but like I figured it out. So um next week I'm going
    to be working on the testing and stuff.
  `.trim();

  console.log('Test transcript:');
  console.log(`"${testTranscript}"`);
  console.log('\nAnalyzing...\n');

  try {
    const result = await analyzer.analyze(testTranscript, {
      mode: 'professional',
      promptText: 'Give a 30-second project status update',
      nativeLanguage: 'Chinese',
      profession: 'Software Engineer',
    });

    console.log('Analysis Result:');
    console.log('-'.repeat(40));
    console.log(`Filler words: ${result.fillerWords.total}`);
    console.log('  Breakdown:', JSON.stringify(result.fillerWords.breakdown));
    console.log(`\nPace: ${result.pace.wpm} WPM (${result.pace.assessment})`);
    if (result.pace.suggestion) {
      console.log(`  Suggestion: ${result.pace.suggestion}`);
    }

    console.log(`\nGrammar issues: ${result.grammarIssues.length}`);
    result.grammarIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. "${issue.original}" → "${issue.corrected}"`);
      if (issue.explanation) {
        console.log(`     ${issue.explanation}`);
      }
    });

    console.log(`\nStructure score: ${result.structure.score}/100`);
    console.log(`  ${result.structure.feedback}`);

    console.log('\nPolished version:');
    console.log(`  "${result.polishedVersion}"`);

    console.log('\nCoaching tip:');
    console.log(`  ${result.coachingTip}`);

    console.log('\nStrengths:');
    result.strengths.forEach((s) => console.log(`  - ${s}`));

    console.log('\n✅ Communication analysis test passed!');
  } catch (error) {
    console.error('❌ Communication analysis test failed:', error);
  }
}

async function testSpeechAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Speech Analysis (Azure)');
  console.log('='.repeat(60) + '\n');

  const env = loadEnv();

  const analyzer = new AzureSpeechAnalyzer({
    subscriptionKey: env.AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION,
  });

  // Check if ready
  const ready = await analyzer.isReady();
  console.log(`Azure Speech service ready: ${ready}`);

  if (!ready) {
    console.log('Azure Speech service not ready. Check your credentials.');
    console.log('Note: Full audio test requires a valid WAV file.');
    return;
  }

  console.log('\n✅ Azure Speech service is configured correctly!');
  console.log('\nTo test with actual audio:');
  console.log('1. Record a 30-second WAV file (16kHz, 16-bit, mono)');
  console.log('2. Use the /api/sessions/analyze endpoint');
  console.log('3. Or modify this test to load your audio file');
}

async function testFullAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Full Analysis Service');
  console.log('='.repeat(60) + '\n');

  const env = loadEnv();

  const speechAnalyzer = new AzureSpeechAnalyzer({
    subscriptionKey: env.AZURE_SPEECH_KEY,
    region: env.AZURE_SPEECH_REGION,
  });

  const communicationAnalyzer = new OpenAICommunicationAnalyzer({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  });

  const analysisService = new AnalysisService(
    speechAnalyzer,
    communicationAnalyzer
  );

  const health = await analysisService.healthCheck();
  console.log('Service health:');
  console.log(`  Speech (Azure): ${health.speech ? '✅ Ready' : '❌ Not ready'}`);
  console.log(`  Communication (OpenAI): ${health.communication ? '✅ Ready' : '❌ Not ready'}`);

  if (health.speech && health.communication) {
    console.log('\n✅ All services are ready for full analysis!');
  } else {
    console.log('\n⚠️ Some services are not ready. Check your .env configuration.');
  }
}

async function main() {
  console.log('ProSpeaker Integration Tests');
  console.log('============================\n');

  try {
    await testSpeechAnalysis();
    await testCommunicationAnalysis();
    await testFullAnalysis();
  } catch (error) {
    logger.error('Test failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();

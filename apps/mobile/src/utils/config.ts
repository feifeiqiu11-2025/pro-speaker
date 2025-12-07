/**
 * App configuration
 * TODO: Use environment variables in production
 */
export const config = {
  // Backend API URL
  // For iOS simulator: http://localhost:3000
  // For Android emulator: http://10.0.2.2:3000
  // For physical device: Use your machine's local IP
  API_URL: 'http://localhost:3001',

  // Recording settings
  MAX_RECORDING_DURATION_SECONDS: 30,
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
};

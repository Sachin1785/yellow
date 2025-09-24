#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ngrokAuthToken = process.env.NGROK_AUTHTOKEN;
const ngrokDomain = process.env.NGROK_DOMAIN;
const ngrokPort = process.env.NGROK_PORT || 3000;

if (!ngrokAuthToken) {
  console.error('❌ NGROK_AUTHTOKEN not found in .env.local');
  console.log('Please add your ngrok auth token to .env.local');
  console.log('Get it from: https://dashboard.ngrok.com/get-started/your-authtoken');
  process.exit(1);
}

// Set up ngrok auth token
console.log('🔑 Setting up ngrok auth token...');
const authProcess = spawn('ngrok', ['config', 'add-authtoken', ngrokAuthToken], {
  stdio: 'inherit',
  shell: true
});

authProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Auth token configured successfully');
    
    // Start ngrok tunnel
    console.log(`🚀 Starting ngrok tunnel on port ${ngrokPort}...`);
    
    const ngrokArgs = ['http', ngrokPort];
    
    // Add custom domain if provided
    if (ngrokDomain) {
      ngrokArgs.push('--domain', ngrokDomain);
    }
    
    const tunnel = spawn('ngrok', ngrokArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let tunnelUrl = '';
    let isReady = false;
    
    // Capture stdout to extract tunnel URL
    tunnel.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output); // Still show the output
      
      // Look for the tunnel URL in the output
      const urlMatch = output.match(/https:\/\/[^\s]+\.ngrok\.io/) || 
                      output.match(/https:\/\/[^\s]+\.ngrok-free\.app/) ||
                      (ngrokDomain && output.match(new RegExp(`https://${ngrokDomain}`)));
      
      if (urlMatch && !isReady) {
        tunnelUrl = urlMatch[0];
        isReady = true;
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 NGROK TUNNEL READY!');
        console.log('='.repeat(60));
        console.log(`📡 Tunnel URL: ${tunnelUrl}`);
        console.log(`🏠 Local URL:  http://localhost:${ngrokPort}`);
        console.log('='.repeat(60));
        console.log('💡 Use this URL for webhooks, testing, and sharing');
        console.log('🔗 Copy and paste the tunnel URL where needed');
        console.log('='.repeat(60) + '\n');
      }
    });
    
    // Capture stderr for errors
    tunnel.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    tunnel.on('close', (code) => {
      console.log(`\n🛑 Ngrok tunnel closed with code ${code}`);
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping ngrok tunnel...');
      tunnel.kill();
      process.exit(0);
    });
    
  } else {
    console.error('❌ Failed to configure auth token');
    process.exit(1);
  }
});

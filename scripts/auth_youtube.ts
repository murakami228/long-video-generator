
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import open from 'open';

// Paths
const CLIENT_SECRET_PATH = path.join(process.cwd(), 'client_secret.json');
const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');

// Scopes
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

/**
 * Create an OAuth2 client with the given credentials.
 */
async function authenticate(): Promise<void> {
    if (!fs.existsSync(CLIENT_SECRET_PATH)) {
        console.error('Error: client_secret.json not found.');
        console.error('Please download it from Google Cloud Console and place it in the project root.');
        process.exit(1);
    }

    const content = fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8');
    const credentials = JSON.parse(content);

    // Support both "installed" and "web" formats, though "installed" is typical for desktop
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    try {
        await getNewToken(oAuth2Client);
    } catch (error) {
        console.error('Error authenticating:', error);
    }
}

/**
 * Get and store new token after prompting for user authorization.
 */
async function getNewToken(oAuth2Client: OAuth2Client): Promise<void> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorizing...');

    // Automatically open the URL
    await open(authUrl);
    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            // Save the token for later program executions
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log('Token stored to', TOKEN_PATH);
            console.log('Authentication successful! You can now upload videos.');
        } catch (err) {
            console.error('Error retrieving access token', err);
        }
    });
}

// Run the script
authenticate();

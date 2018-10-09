// Load .env files as process variables
require('dotenv').config();

import * as restify from 'restify';
import { MemoryBotStorage, UniversalBot, ChatConnector, LuisRecognizer } from 'botbuilder';
import { AggregationDialog, SensorDialog, SensorTypeDialog } from './dialogs/sensor-dialog';


// Construct connector
const connector = new ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Construct Bot
const bot = new UniversalBot(connector, (session, _args) => {
    session.endDialog(`Sorry I couldn't understand. Ask me sensor information such as, what is latest temperature?`);
});

const luisAppId = process.env.LuisAppId;
const luisAPIKey = process.env.LuisAPIKey;
const luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Create a recognizer that gets intents from LUIS, and add it to the bot
const recognizer = new LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

// Set storage to Bot
bot.set('storage', new MemoryBotStorage());

bot.dialog('SensorDialog', SensorDialog).triggerAction({matches: 'SensorInformation'});
bot.dialog('AggregationDialog', AggregationDialog);
bot.dialog('SensorTypeDialog', SensorTypeDialog);

// Create restify server
const server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.PORT || 3978, () => console.log(`${server.name} listening to ${server.url}`));
import { config } from 'dotenv';
import Express from 'express';
import Telegraf from 'telegraf';
import axios from 'axios';
import { get } from 'lodash';
import { join } from 'path';
import dedent from 'dedent';
import COUNTRIES from './countries.json';

// config dotenv
config();

const PORT = process.env.PORT || 3000;
const HOST = 'https://covid2019-api.herokuapp.com';

const app = Express();
const bot = new Telegraf(process.env.BOT_TOKEN || '');
app.use(bot.webhookCallback(`/${process.env.BOT_SECRET_PATH}`));
bot.telegram.setWebhook(`${process.env.BOT_URL}:443/${process.env.BOT_SECRET_PATH}`);

const getData = async (path: string): Promise<string> => {
    try {
        const response = await axios.get(`${HOST}${path}`);
        const data = get(response, 'data.data');
        return data ?
            dedent`
        *${data.location || 'Global'} ${data.location === 'Vietnam' ? '🇻🇳' : ''}*
        - confirmed: ${data.confirmed} 😷
        - deaths: ${data.deaths} 💀
        - recovered: ${data.recovered} 😀
        - active: ${data.active} 😥
        ` :
            'Not found'
            ;
    } catch (error) {
        return 'Not found'
    }
}

const renderUsage = dedent`
    *You can control me by sending these commands:*

    /all - global summary
    /[country] - a [country] summary (e.g. /vietnam or /us or /china)
    /help
`;

bot.start((ctx) => ctx.replyWithMarkdown(dedent`
    *Welcome 👋 to 🤖 CovidBot*

    Get realtime data about Coronavirus.

    ${renderUsage}
`));
bot.command('help', (ctx) => {
    ctx.replyWithMarkdown(renderUsage);
});
bot.command('all', async (ctx) => {
    ctx.replyWithMarkdown(await getData('/v2/total'));
});
bot.command(COUNTRIES, async (ctx) => {
    const countryName = ctx.message?.text?.replace('_', ' ').toLowerCase();
    ctx.replyWithMarkdown(await getData(`/v2/country${countryName}`));
});
// 404 command
bot.on('text', (ctx) =>
    ctx.replyWithPhoto({ source: join(__dirname, 'images/not_found.jpg') })
);

bot.launch();

app.get('/', (_, res) => res.send('Chao Xìn'));
app.listen(PORT, () => console.log('app is listening on port 8000'));

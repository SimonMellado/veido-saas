require('dotenv').config();
const mongoose = require('mongoose');
const GuildConfig = require('./models/GuildConfig');

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const config = await GuildConfig.findOneAndUpdate(
        { guildId: '1409943846363598890' },
        { $set: { 'welcome.enabled': true, 'welcome.channelId': '1495109465165402345' } },
        { upsert: true, new: true }
    );
    console.log('✅ Guardado:', config.welcome);
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
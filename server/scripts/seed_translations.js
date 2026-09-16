import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { defaultTranslations } from '../data/defaultTranslations.js';
import Language from '../models/Language.js';
import Translation from '../models/Translation.js';

const URL = 'mongodb://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@ac-q5mzaeb-shard-00-00.ehihisg.mongodb.net:27017,ac-q5mzaeb-shard-00-01.ehihisg.mongodb.net:27017,ac-q5mzaeb-shard-00-02.ehihisg.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ykmbj-shard-0&authSource=admin&appName=Cluster0';

async function seed() {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(URL);
    console.log('Connected!');

    // 1. Ensure Languages Exist
    const languages = [
        { name: 'English', code: 'en', app_code: 'en', flag: 'us', dir: 'LTR', isRtl: false, isDefault: true, isActive: true },
        { name: 'Hindi (हिन्दी)', code: 'in', app_code: 'hi', flag: 'in', dir: 'LTR', isRtl: false, isDefault: false, isActive: true },
        { name: 'Arabic (العربية)', code: 'sa', app_code: 'ar', flag: 'sa', dir: 'RTL', isRtl: true, isDefault: false, isActive: true }
    ];

    for (const lang of languages) {
        await Language.findOneAndUpdate(
            { code: lang.code },
            { $set: lang },
            { upsert: true, new: true }
        );
    }
    console.log('Languages synchronized in DB.');

    // 2. Prepare Translations
    const transOps = [];
    const enDict = {};
    const hiDict = {};
    const arDict = {};

    for (const [key, val] of Object.entries(defaultTranslations)) {
        const enVal = val.en || key;
        const hiVal = val.hi || enVal;
        const arVal = val.ar || enVal;

        enDict[key] = enVal;
        hiDict[key] = hiVal;
        arDict[key] = arVal;

        // Upsert for en
        transOps.push({
            updateOne: {
                filter: { lang: 'en', lang_key: key },
                update: { $set: { lang: 'en', lang_key: key, lang_value: enVal } },
                upsert: true
            }
        });

        // Upsert for in (India code) & hi (ISO code)
        transOps.push({
            updateOne: {
                filter: { lang: 'in', lang_key: key },
                update: { $set: { lang: 'in', lang_key: key, lang_value: hiVal } },
                upsert: true
            }
        });
        transOps.push({
            updateOne: {
                filter: { lang: 'hi', lang_key: key },
                update: { $set: { lang: 'hi', lang_key: key, lang_value: hiVal } },
                upsert: true
            }
        });

        // Upsert for sa (Saudi Arabia code) & ar (ISO code)
        transOps.push({
            updateOne: {
                filter: { lang: 'sa', lang_key: key },
                update: { $set: { lang: 'sa', lang_key: key, lang_value: arVal } },
                upsert: true
            }
        });
        transOps.push({
            updateOne: {
                filter: { lang: 'ar', lang_key: key },
                update: { $set: { lang: 'ar', lang_key: key, lang_value: arVal } },
                upsert: true
            }
        });
    }

    if (transOps.length > 0) {
        console.log(`Writing ${transOps.length} translation operations to MongoDB...`);
        const result = await Translation.bulkWrite(transOps);
        console.log('Translation bulkWrite finished:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        });
    }

    // 3. Store full dictionaries directly into Language.translations
    await Language.updateOne({ code: 'en' }, { $set: { translations: enDict } });
    await Language.updateOne({ code: 'in' }, { $set: { translations: hiDict } });
    await Language.updateOne({ code: 'sa' }, { $set: { translations: arDict } });

    console.log('Language dictionaries updated successfully.');
    console.log('Seeding finished successfully!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
});

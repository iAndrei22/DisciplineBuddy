const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB");
    
    const challenges = await mongoose.connection.db.collection('challenges').find({}).toArray();
    
    console.log('\n=== Challenges participants structure ===\n');
    challenges.forEach(c => {
        console.log('Challenge:', c.title);
        console.log('Participants:', JSON.stringify(c.participants, null, 2));
        console.log('---');
    });
    
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

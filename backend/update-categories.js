const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB");
    
    // Update categories
    const catResult = await mongoose.connection.db.collection('challenges').updateMany(
        { category: { $exists: false } },
        { $set: { category: 'Habits & Routines' } }
    );
    console.log('Updated', catResult.modifiedCount, 'challenges with default category');

    // Add createdAt to challenges that don't have it
    const dateResult = await mongoose.connection.db.collection('challenges').updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date('2026-01-20'), updatedAt: new Date() } }
    );
    console.log('Updated', dateResult.modifiedCount, 'challenges with createdAt');

    // Migrate participants from simple ObjectId array to object array
    const challenges = await mongoose.connection.db.collection('challenges').find({}).toArray();
    
    for (const challenge of challenges) {
        if (challenge.participants && challenge.participants.length > 0) {
            // Check if first participant is already an object (has 'user' field)
            const firstParticipant = challenge.participants[0];
            if (firstParticipant && !firstParticipant.user) {
                // Old format - migrate to new format
                const newParticipants = challenge.participants.map(userId => ({
                    user: userId,
                    status: 'in-progress',
                    enrolledAt: challenge.createdAt || new Date(),
                    completedAt: null
                }));
                
                await mongoose.connection.db.collection('challenges').updateOne(
                    { _id: challenge._id },
                    { $set: { participants: newParticipants } }
                );
                console.log('Migrated participants for challenge:', challenge.title);
            }
        }
    }
    
    console.log('Migration complete!');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

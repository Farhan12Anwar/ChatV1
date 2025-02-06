const cron = require('node-cron');
const Room = require('./models/Room');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const emptyRooms = await Room.find({ users: { $size: 0 } });

  for (const room of emptyRooms) {
    await Room.deleteOne({ _id: room._id });
    console.log(`Deleted empty room: ${room.name}`);
  }
});

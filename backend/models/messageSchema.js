const messageSchema = new mongoose.Schema({
    text: String,
    imageUrl: String,
    sender: String,
    room: String,
    timestamp: { type: Date, default: Date.now },
  });
  
  const Message = mongoose.model("Message", messageSchema);
  
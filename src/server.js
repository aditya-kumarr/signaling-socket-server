const http = require("http").createServer();
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

class Call {
  constructor(
    sender,
    offer,
    answer = null,
    receiver = null,
    offerCandiates = [],
    answerCandidates = []
  ) {
    this.offer = offer;
    this.answer = answer;
    this.offerCandiates = offerCandiates;
    this.answerCandidates = answerCandidates;
    this.sender = sender;
    this.receiver = receiver;
  }
}

const callDetails = {};

io.on("connection", (socket) => {
  console.log(socket.id + " connected");
  socket.emit("connection", socket.id);
  // this will be called onicecandidate of the one giving offer

  // this will be called after the offer has been created
  socket.on("setOffer", (offer, roomID) => {
    // create a new call object and set it's properties
    const call = new Call(socket.id, offer);
    callDetails[roomID] = call;
    console.log("offer set");
    console.log(roomID);
    socket.on("setOfferCandidate", (data) => {
      callDetails[roomID].offerCandiates.push(data);
      socket.broadcast.emit("getOfferCandidate", data);
      console.log("offer Candidate set");
    });
  });
  // this will be called when the other user answers the call
  socket.on("getOffer", (roomID) => {
    console.log(roomID);
    try {
      socket.emit("offer", callDetails[roomID].offer);
      console.log("offer event emitted");
    } catch (error) {
      console.log("some error happened");
      socket.emit("onerror", "sorry that room doesn't exits");
      return;
    }
    socket
      .to(callDetails[roomID].sender)
      .emit("getOfferCandidate", callDetails[roomID].offerCandiates);
    console.log("offer get");

    // this will be called when the other sends the answer

    socket.on("setAnswer", (answer) => {
      callDetails[roomID].answer = answer;
      socket
        .to(callDetails[roomID].sender)
        .emit("getAnswer", callDetails[roomID].answer);
      console.log("answer set");
    });
    socket.on("setAnswerCandidate", (candidate) => {
      callDetails[roomID].answerCandidates.push(candidate);
      console.log("answer candidate set set");
      socket
        .to(callDetails[roomID].sender)
        .emit("getAnswerCandidate", callDetails[roomID].answerCandidates);
    });
  });

  // this will be called onicecandidate of the one giving answer
});
const PORT = process.env.PORT || 1000;
http.listen(3000, () => console.log(`listening on http://localhost:${PORT}`));

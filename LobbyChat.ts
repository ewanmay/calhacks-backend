import { User, ClientMessage, ServerMessage, Game } from './types';

class LobbyChat {
  users: User[]
  sendMessageToAllUsers: (command: string, message: any) => void
  suggestGame: () => Game
  messageLog: ServerMessage[]

  constructor(users: User[], sendMessageToAllUsers: (command: string, message: any) => void, suggestGame: () => Game){
    this.users = users
    this.sendMessageToAllUsers = sendMessageToAllUsers
    this.suggestGame = suggestGame
    this.messageLog = [] 
  }

  setupSocketConnectionsForUser(socket){
    socket.on('add-chat-message', (msg: ClientMessage) => {
      console.log("add-chat-message from:",msg.username,":", msg.messageContents)
      const serverMessage = {username: msg.username, messageContents: msg.messageContents, date: new Date().toUTCString()}
      this.messageLog.push(serverMessage);
      if (this.messageLog.length > 200) {
        this.messageLog.shift();
      }
      if (msg.messageContents.substring(0, 5) == "/help")
      {
        const helpMessage = {
          username: "Help bot",
          messageContents: "Dont see your games? Try going to your profile and reconnecting your steam account!",
          date: new Date().toUTCString()}
        this.messageLog.push(helpMessage)
        if (this.messageLog.length > 200) {
          this.messageLog.shift();
        }
      }
      if (msg.messageContents.substring(0, 14) == "/suggest-game")
      {
        const messageContents = this.suggestGame()? "You should play " + this.suggestGame().name + "!" : "No games are available!"
        const helpMessage = {
          username: "Help bot",
          messageContents,
          date: new Date().toUTCString()}
        this.messageLog.push(helpMessage)
        if (this.messageLog.length > 200) {
          this.messageLog.shift();
        }
      }
      console.log('sending messageLog')
      this.sendMessageToAllUsers('message-log', this.messageLog)
    })

    socket.emit('message-log', this.messageLog)
  }

  removeSocketConnectionsForUser(socket){
    socket.removeAllListeners('add-chat-message')
  }

}

module.exports = LobbyChat
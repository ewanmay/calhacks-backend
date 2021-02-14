import { CommonGames, Game, GameSource, User } from './types';

const LobbyChat = require('./LobbyChat')
const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// we know these shouldn't be here ok
const twilioAccountSid = 'AC228815c2112277eaadeb9ec8e8fc08e9';
const twilioApiKey = 'SK9a85493643292f004062227a10df2587';
const twilioApiSecret = 'ewZugsyLQrcu9jZKDkFzUpDb8kAkfW72';

class Lobby {

  io: any // TODO
  db: any // TODO
  lobbyCode: string
  users: User[]
  steamGames: Game[]
  epicGames: Game[]
  freeGames: Game[]

  filterFreeGames: boolean
  filterSteamGames: boolean
  filterEpicGames: boolean

  lobbyChat: typeof LobbyChat

  constructor(io, db, lobbyCode) {
    this.io = io
    this.db = db
    this.lobbyCode = lobbyCode
    this.users = []
    this.steamGames = []
    this.epicGames = []
    this.freeGames = []
    this.filterFreeGames = true
    this.filterSteamGames = true
    this.filterEpicGames = true
    this.lobbyChat = new LobbyChat(this.users, this.sendMessageToAllUsers.bind(this), this.suggestGame.bind(this))

    this.io.emit('test', 'hello world')
    console.log("Creating new lobby")
  }

  /*
   *  Creates an object to fully describe this objects state.
   */
  getLobbyInfo() {
    return {
      lobbyCode: this.lobbyCode,
      users: this.users ? this.users.map((u) => u.username) : [],
      commonGames: { steamGames: this.steamGames, epicGames: this.epicGames, freeGames: this.freeGames }
    }
  }

  /*
   *  Adds a user to a lobby.
   *  Will update all users in this lobby of the change.
   */
  addUserToLobby(username: string, socket) {
    if (!this.users) return
    this.users.push({ username, socket })
    socket.join(this.lobbyCode)
    console.log('sending joined-lobby to', username)
    socket.emit('joined-lobby', this.getLobbyInfo())
    this.resetListsOfAvailableGames(() => {
      this.sendMessageToAllUsers('lobby-updated', this.getLobbyInfo())
      this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
    })
    this.lobbyChat.setupSocketConnectionsForUser(socket)

    // video
    socket.on('get-token', (username: string) => {
      const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret);
      token.identity = username;
      const videoGrant = new VideoGrant({ room: this.lobbyCode });
      token.addGrant(videoGrant);
      socket.emit('token', token.toJwt());
    })

    socket.on('filter-free-games', (filterFreeGames: boolean) => {
      this.filterFreeGames = filterFreeGames
      this.resetListsOfAvailableGames(() => {
        this.sendMessageToAllUsers('lobby-updated', this.getLobbyInfo())
        this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
      })
      this.sendMessageToAllUsers('filter-free-games-changed', filterFreeGames)
    })
    socket.on('filter-steam-games', (filterSteamGames: boolean) => {
      this.filterSteamGames = filterSteamGames
      this.resetListsOfAvailableGames(() => {
        this.sendMessageToAllUsers('lobby-updated', this.getLobbyInfo())
        this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
      })
      this.sendMessageToAllUsers('filter-steam-games-changed', filterSteamGames)
    })
    socket.on('filter-epic-games', (filterEpicGames: boolean) => {
      this.filterEpicGames = filterEpicGames
      this.resetListsOfAvailableGames(() => {
        this.sendMessageToAllUsers('lobby-updated', this.getLobbyInfo())
        this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
      })
      this.sendMessageToAllUsers('filter-epic-games-changed', filterEpicGames)
    })

    socket.on('vote-for-free-game', (username: string, appid: string) => {
      const game = this.freeGames.find((game) => game.appid == appid)
      if (game) {
        const hasUserVoted = game.votes.some(name => name === username)
        hasUserVoted ? game.votes = game.votes.filter(name => name !== username) : game.votes.push(username)
      }
      console.log("Game: ", game)
      this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
    })

    socket.on('vote-for-steam-game', (username: string, appid: string) => {
      const game = this.steamGames.find((game) => game.appid == appid)
      if (game) {
        const hasUserVoted = game.votes.some(name => name === username)
        hasUserVoted ? game.votes = game.votes.filter(name => name !== username) : game.votes.push(username)
      }
      this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
    })

    socket.on('vote-for-epic-game', (username: string, appid: string) => {
      const game = this.epicGames.find((game) => game.appid == appid)
      if (game) {
        const hasUserVoted = game.votes.some(name => name === username)
        hasUserVoted ? game.votes = game.votes.filter(name => name !== username) : game.votes.push(username)
      }
      this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
    })

  }

  removeUserFromLobby(username: string): boolean {
    if (!this.users) return false
    const user = this.users.find((u) => u.username === username)
    if (!user) return false
    user.socket.leave(this.lobbyCode)
    this.lobbyChat.removeSocketConnectionsForUser(user.socket)
    this.users = this.users.filter((u) => u.username !== username)
    this.resetListsOfAvailableGames(() => {
      this.sendMessageToAllUsers('lobby-updated', this.getLobbyInfo())
      this.sendMessageToAllUsers('available-games', { freeGames: this.freeGames, steamGames: this.steamGames, epicGames: this.epicGames })
    })


    return true
  }

  suggestGame(): Game | null {
    console.log("Suggesting game")
    const allAvailableGames = this.freeGames.concat(this.steamGames.concat(this.epicGames))
    let highestVotedGameIndex = -1
    let highestVotes = -1
    allAvailableGames.forEach((game, index) => {
      if(game.votes.length > highestVotes){
        highestVotedGameIndex = index
        highestVotes = game.votes.length
      }
      console.log("Printing game name: " + game.name)
    })

    if(highestVotedGameIndex === -1){
      return null
    }


    const gamesToSuggest = allAvailableGames.filter((game) => game.votes.length === highestVotes)
    const gameIndexToSuggest = Math.round(Math.max(Math.random() * gamesToSuggest.length - 1, 0))
    console.log("Suggesting game: ", gamesToSuggest[gameIndexToSuggest])
    return gamesToSuggest[gameIndexToSuggest]
  }

  convertRowToGameObject(row): Game {
    const game = {
      name: row.name,
      multiplayer: true,
      website: row.website,
      appid: row.id,
      minPlayers: row.prefferedMinPlayers,
      maxPlayers: row.prefferedMaxPlayers,
      source: GameSource.Free,
      votes: []
    }

    return game
  }

  convertSteamRowToGameObject(row): Game {
    const game = {
      name: row.name,
      multiplayer: row.multiplayer,
      website: row.website,
      appid: row.appid,
      minPlayers: row.prefferedMinPlayers,
      maxPlayers: row.prefferedMaxPlayers,
      source: GameSource.Steam,
      votes: []
    }

    return game
  }

  resetListsOfAvailableGames(finishedCallback) {

    let userGameList = [];

    const appendUserSteamGames = (rows) => {
      if (this.filterSteamGames) {
        userGameList = userGameList.concat(rows.map((row) => this.convertSteamRowToGameObject(row)))
      }
      else {
        this.steamGames = []
      }
    }

    const filterFinalGames = (rows) => {
      // Get all steam games that have the same appid
      if (this.filterSteamGames) {
        userGameList = userGameList.concat(rows.map((row) => this.convertSteamRowToGameObject(row)))
      }
      else {
        this.steamGames = []
      }

      const filteredSteamGames = [];
      const noNamesRemoved = userGameList.filter((game) => game.name !== "")
      noNamesRemoved.forEach((game) => {
        if (noNamesRemoved.filter((filteredGame) => game.appid === filteredGame.appid).length === this.users.length && !filteredSteamGames.some(filteredGame => filteredGame.appid === game.appid)) {

          // Check min-max players of this game
          let minSum = 0;
          let numMins = 0;
          noNamesRemoved.filter((filteredGame) => game.appid === filteredGame.appid).forEach((game) => {
            if(game.minPlayers){
              minSum += game.minPlayers
              numMins++
            }
          })
          const meanMin = numMins !== 0? Math.floor(minSum / numMins) : 0

          let maxSum = 0;
          let numMaxs = 0;
          noNamesRemoved.filter((filteredGame) => game.appid === filteredGame.appid).forEach((game) => {
            if(game.maxPlayers){
              maxSum += game.maxPlayers
              numMaxs++
            }
          })
          const meanMax = numMaxs !== 0? Math.floor(maxSum / numMaxs) : 0
          game.minPlayers = meanMin;
          game.maxPlayers = meanMax;

          if((minSum === 0 || game.minPlayers <= this.users.length) && (maxSum === 0 || game.maxPlayers >= this.users.length)){
            console.log("Adding game: ", game)
            filteredSteamGames.push(game)
          }
        }
      })

      this.steamGames = filteredSteamGames;

      finishedCallback();
    }

    const populateFreeGamesAndPopulateSteamGames = (rows) => {
      if (this.filterFreeGames) {
        this.freeGames = rows.map((row) => this.convertRowToGameObject(row))
        const filteredFreeGames = [];
        this.freeGames.forEach((game) => {
          if (this.freeGames.filter((filteredGame) => game.appid === filteredGame.appid).length === this.users.length && !filteredFreeGames.some(filteredGame => filteredGame.appid === game.appid)) {

            // Check min-max players of this game
            let minSum = 0;
            let numMins = 0;
            this.freeGames.filter((filteredGame) => game.appid === filteredGame.appid).forEach((game) => {
              if(game.minPlayers){
                minSum += game.minPlayers
                numMins++
              }
            })
            const meanMin = numMins !== 0? Math.floor(minSum / numMins) : 0

            let maxSum = 0;
            let numMaxs = 0;
            this.freeGames.filter((filteredGame) => game.appid === filteredGame.appid).forEach((game) => {
              if(game.maxPlayers){
                maxSum += game.maxPlayers
                numMaxs++
              }
            })
            const meanMax = numMaxs !== 0? Math.floor(maxSum / numMaxs) : 0
            game.minPlayers = meanMin;
            game.maxPlayers = meanMax;

            if((minSum === 0 || game.minPlayers <= this.users.length) && (maxSum === 0 || game.maxPlayers >= this.users.length)){
              console.log("Adding game: ", game)
              filteredFreeGames.push(game)
            }
            this.freeGames = filteredFreeGames
          }
        })
      }
      else {
        this.freeGames = []
      }

      const addUserInfo = (username, rows) => {
        userGameList.push(rows.map((row) => this.convertRowToGameObject(row)))
      }
      for (let i = 0; i < this.users.length; i++) {
        if (i + 1 !== this.users.length) {
          this.db.getUserSteamGames(this.users[i].username, appendUserSteamGames)
        }
        else {
          this.db.getUserSteamGames(this.users[i].username, filterFinalGames)
        }
      }
    }

    this.db.getAllFreeGames(populateFreeGamesAndPopulateSteamGames)

  }

  lobbySize(): number {
    return this.users.length
  }

  /*
   *  Will send the provided message to all users in this lobby, including the host.
   *  Requires:
   *  - command: string key matcher for socket io connection
   *  - message: the message to broadcast to all users.
   */
  sendMessageToAllUsers(command: string, message: any) {
    // Long method why arent rooms working
    // if (this.users) console.log("USERS", this.users.map(u=>u.username))
    // if(this.users) this.users.forEach((user) => user.socket.emit(command, message))
    if (this.io) {
      // console.log("Sending command: " + command)
      this.io.to(this.lobbyCode).emit(command, message)
    }
  }

}

module.exports = Lobby
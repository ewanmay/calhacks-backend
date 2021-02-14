import { Game } from './types';

const sqlite3 = require('sqlite3').verbose()

const DBSOURCE = 'db.sqlite'

class Database {
  db: any
  constructor() {
    this.db = new sqlite3.Database(DBSOURCE, (err) => {
      if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
      } else {
        console.log('Connected to SQLite database.')
        this.makeUserTable()
        this.makeSteamGameTable() 
        this.makeUserSteamGamesTable()
        this.makeFreeGameTable()
        this.makeFriendRequestTable()
        this.makeFriendTable()
      }
    })
  }

  makeUserTable() {
    this.db.run(
      `CREATE TABLE user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username text NOT NULL UNIQUE, 
        email text NOT NULL UNIQUE, 
        password text NOT NULL,
        steam_id text
      )`,
      (err) => {
        if (err) {
          // Table already created
          // console.log("Error: ", err)
          console.log('SQLite found table: user')
        } else {
          // Table just created, creating some rows
          // TODO remove when want to remove seed users
          console.log('SQLite creating table: user')
          const insert = 'INSERT INTO user (username, password, email) VALUES (?,?,?)'
          console.log('SQLite adding seed users')
          this.db.run(insert, ['ross', '123', 'ross@test.com'])
          this.db.run(insert, ['ewan', '123', 'ewan@test.com'])
          this.db.run(insert, ['dylan','123', 'dylan@test.com'])
          this.db.run(insert, ['antoine', '123', 'antoine@test.com'])
        }
      }
    )
  }

  /*
   *   Please note the callback may not get called immediately.
   *
   *   Returns:
   *   - row: the sql row returned with user that was found.
   *   - undefined: user was not found
   */
  getUserInfo(username, callback) {
    const sql = 'select * from user where username = ?'
    const params = [username]

    this.db.get(sql, params, (err, row) => {
      if (err) {
        console.log(err)
        return callback(err.message)
      }
      return callback(row)
    })
  }

  login(username, password, callback) {
    const sql = 'select * from user where username = ? and password = ?'
    const params = [username, password]
    this.db.get(sql, params, (err, row) => {
      if (err) {
        return callback(err.message)
      }
      return callback(row)
    })
  }

  /*
   *   Please note the callback may not get called immediately.
   */
  addNewUser(username, password, email, callback) {
    const sql = 'INSERT INTO user (username, password, email) VALUES (?,?,?)'
    const params = [username, password, email]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        return callback(err.message)
      }
      return callback({ id: this.lastID })
    })
  }

  addSteamId(username, steamId, callback) {
    const sql = 'UPDATE user set steam_id = ? WHERE username = ?'
    const params = [steamId, username]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        console.log('ERROR addSteamId', err.message)
        return callback(false)
      }
      return callback(true)
    })

  }

  makeFriendTable() {
    this.db.run(
      `CREATE TABLE friend (
        username1 text NOT NULL, 
        username2 text NOT NULL, 
        PRIMARY KEY (username1, username2)
      )`,
      (err) => {
        if (err) {
          // Table already created
          // console.log("Error: ", err)
          console.log('SQLite found table: friend')
        } 
      }
    )
  }

  addFriend(username1: string, username2:string, callback){
    const sql = 'INSERT INTO friend (username1, username2) VALUES (?,?)'
    const params = [username1, username2]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        console.log('ERROR ', err.message)
        return callback(err.message)
      }
      return callback({ id: this.lastID })
    })
  }

  getUserFriends(username, callback){
    const sql = 'SELECT * FROM friend WHERE username1 = ?'
    const params = [username]
    this.db.all(sql, params, function (err, rows) {
      if (err) {
        console.log('ERROR ', err.message)
        return callback(err.message)
      }
      return callback(rows)
    })
  }

  makeFriendRequestTable() {
    this.db.run(
      `CREATE TABLE friend_request (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sending text NOT NULL, 
        receiving text NOT NULL
      )`,
      (err) => {
        if (err) {
          // Table already created
          // console.log("Error: ", err)
          console.log('SQLite found table: friend_request')
        } 
      }
    )
  }

  addFriendRequest(sending: string, receiving:string, callback){
    const sql = 'INSERT INTO friend_request (sending, receiving) VALUES (?,?)'
    const params = [sending, receiving]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        console.log('ERROR ', err.message) 
        return callback(false)
      }
      return callback(true)
    })
  }

  getFriendRequest(id: number, callback){
    const sql = 'SELECT * FROM friend_request WHERE id = ?'
    const params = [id]
    this.db.get(sql, params, function (err, row) {
      if (err) {
        console.log('ERROR ', err.message)
        return callback(err.message)
      }
      return callback(row)
    })
  }

  getIncommingRequests(username: string, callback){
    const sql = 'SELECT * FROM friend_request WHERE receiving = ?'
    const params = [username]
    this.db.all(sql, params, function (err, rows) {
      if (err) {
        console.log('ERROR ', err.message)
        return callback(err.message)
      }
      return callback(rows)
    })
  }

  getOutgoingRequests(username: string, callback){
    const sql = 'SELECT * FROM friend_request WHERE sending = ?'
    const params = [username]
    this.db.all(sql, params, function (err, rows) {
      if (err) {
        console.log('ERROR ', err.message)
        return callback(err.message)
      }
      return callback(rows)
    })
  }

  deleteFriendRequest(id:number, callback){
    console.log("Deleting friend request: ", id)
    const sql = 'DELETE FROM friend_request WHERE id = ?'
    const params = [id]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        console.log('ERROR addSteamId', err.message)
        return callback(false)
      }
      return callback(true)
    })
  }
  checkValidFriendRequest(to: string, from: string, callback) {
    console.log(to, from)
    const sql = 'SELECT * FROM friend_request WHERE sending = ? AND receiving = ?'
    const params = [from, to ]
    this.db.get(sql, params, function (err, row) {
      if (err) {
        console.log('ERROR getting friend request', err.message)
        return callback(false)
      }
      return callback(row)
    })
  }
  
  makeSteamGameTable() {
    this.db.run(
      `CREATE TABLE steam_game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appid INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL, 
        website TEXT,
        multiplayer INTEGER 
      )`,
      (err) => {
        if (err) {
          // Table already created
          console.log('SQLite found table: steam_game')
        } 
      }
    )
  }

  makeUserSteamGamesTable() {
    this.db.run(
      `CREATE TABLE user_steam_games (
        appid INTEGER NOT NULL, 
        username TEXT NOT NULL,
        prefferedMinPlayers INTEGER,
        prefferedMaxPlayers INTEGER,
        PRIMARY KEY (appid, username)
      )`,
      (err) => {
        if (err) {
          // Table already created
          console.log('SQLite found table: user_steam_games')
        } 
      }
    )
  }

  getUserSteamGames(username, callback){
    const newSql = 'SELECT * FROM user_steam_games INNER JOIN steam_game ON user_steam_games.appid=steam_game.appid WHERE user_steam_games.username=?' 
    // const sql = 'SELECT * FROM user_steam_games INNER JOIN steam_game ON user_steam_games.appid=steam_game.appid' 
    const newParams = [username]
    this.db.all(newSql, newParams, function (err, rows) {
      if (err) {
        return callback(err.message)
      }
      return callback(rows)
    })

  }

  addSteamGame(appid, game: Game, callback){
    const sql = 'INSERT INTO steam_game (appid, name, website, multiplayer) VALUES (?,?,?,?)'
    const params = [appid, game.name, game.website, game.multiplayer]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        return callback(err.message)
      }
      return callback({ id: this.lastID })
    })
  }

  updatePreferredPlayers(appid, username: string, min:number, max:number, callback){
    const sql = 'UPDATE user_steam_games SET prefferedMinPlayers = ?, prefferedMaxPlayers = ? WHERE appid = ? and username = ? '
    const params = [min, max, appid, username]
    this.db.run(sql, params, function (err, result) {
      if (err) {
        console.log('ERROR updatePreferredPlayers', err.message)
        return callback(false)
      }
      return callback(true)
    })
  }

  addUserSteamGame(appid, username: string, callback){
    const userGamesListSql = 'INSERT INTO user_steam_games (appid, username) VALUES (?, ?)'
    const userGamesParams = [appid, username]
    this.db.run(userGamesListSql, userGamesParams, () => callback(appid))
  }

  getUserSteamGame(appid, username: string, callback){
    const sql = 'SELECT * from user_steam_games WHERE appid = ? AND username = ?'
    const params = [appid,username]
    this.db.get(sql, params, (err, row) => {
      if (err) {
        console.log('ERROR getUserSteamGame', err.message)
        return callback(err.message, appid)
      }
      return callback(row, appid) 
    })
  } 

  getSteamGame(appid, callback){
    const sql = 'select * from steam_game where appid = ?'
    const params = [appid]

    this.db.get(sql, params, (err, row) => {
      if (err) {
        return callback(err.message, appid)
      } 
      return callback(row, appid)
    })
  }

  getAllSteamGamesForUser(username, callback){
    // Join tables of users steam games then return all rows that included the steam game names
  }

  
  makeFreeGameTable() {
    this.db.run(
      `CREATE TABLE free_game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE, 
        website TEXT,
        prefferedMinPlayers INTEGER,
        prefferedMaxPlayers INTEGER
      )`,
      (err) => {
        if (err) {
          // console.log("Error: ", err)
          console.log('SQLite found table: free_game')
        } 
        console.log('SQLite created table: free_game')
        const insert = 'INSERT INTO free_game (name, website, prefferedMinPlayers, prefferedMaxPlayers) VALUES (?,?,?,?)'
        this.db.run(insert, ['ChessX', 'http://www.chessx.ca/', '2','8'], () => {})
        this.db.run(insert, ['CodeNames', 'https://codenames.game/', '4','12'], () => {})
        this.db.run(insert, ['Minecraft', 'https://www.minecraft.net/', '1','100'], () => {})
        this.db.run(insert, ['Settlers of Catan', 'https://colonist.io/', '2','6'], () => {})
      }
    )
  }

  getAllFreeGames(callback){
    const sql = 'select * from free_game'
    const params = []

    this.db.all(sql, params, (err, rows) => {
      if (err) {
        console.log('ERROR getAllFreeGames', err.message)
        return callback(err.message)
      }
      return callback(rows)
    })
    
  }

}

module.exports = Database

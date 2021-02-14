export interface State {
  socket: SocketIOClient.Socket,
  authState: AuthState,
  profile: UserProfile,
  commonGames: CommonGames
}

export interface AuthState {
  id: number,
  username: string,  
  email: string,
  loggedIn: boolean,
  errorMessage: string
}

export interface LoginObj {
  username: string,
  password: string
}

export interface Test {
  id: Number;
}

export interface User {
  username: string,
  socket: any
}

export interface ClientMessage {
  messageContents: string,
  username: string
}

export interface ServerMessage {
  messageContents: string,
  username: string,
  date: string
}

export interface MessageLog {
  messages: ServerMessage[]
}

export interface UserProfile {
  name: string,
  steam: Steam,
  friends: Friend[],
  outgoingRequests: FriendRequest[],
  incomingRequests: FriendRequest[]
}

export interface Steam {
  steamUsername: string
  steamError: string,
  profileUrl: string,
  avatarUrl: string,
  steamId: string,
  games: Game[]
}

export enum GameSource {
  Steam = "steam",
  Free = "free",
  Epic = "epic"
}

export interface Game {
  name: string,
  multiplayer: boolean,
  website: string,
  appid: string
  source: GameSource
  minPlayers?: number,
  maxPlayers?: number,
  votes?: string[]
}

export interface CommonGames {
  steamGames: Game[],
  epicGames: Game[],
  freeGames: Game[]
}

export interface Friend {
  username: string
}

export interface FriendRequest {
  id: number,
  sending: string, 
  receiving: string
}

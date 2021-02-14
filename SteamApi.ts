import { Game } from './types';

const axios = require('axios').default;

class SteamApi {

    key: string;
   
    constructor(key: string) {
        this.key = key;
    }

    getUserInfo(steamid, callback){
        return axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
            params: {
                key: this.key,
                steamids: steamid,
                format: 'json'
            }
            })
            .then(response =>callback(response.data))
            .catch(error =>{
                console.log(error);
                callback();
            })
            .then(function () {
                // always executed
            });       
    }

    getUserGameList(steamid, callback) {
        return axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
            params: {
                key: this.key,
                steamid: steamid,
                format: 'json'
            }
            })
            .then(response =>callback(response.data))
            .catch(error =>{
                console.log(error);
                callback();
            })
            .then(function () {
                // always executed
            });
    }

    syncUserGameList(steamid, callback) {
        axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
            params: {
                key: this.key,
                steamid: steamid,
                format: 'json'
            }
            })
            .then(response =>callback(response.data))
            .catch(error =>{
                console.log(error);
                callback();
            })
            .then(function () {
                // always executed
            });
    }

    getGameInfo(appid, callback){
        return axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}`)
            .then(response =>callback(response.data, appid))
            .catch(error =>{
                console.log(error);
                callback();
            })
            .then(function () {
                // always executed
            });
    }
}

module.exports = SteamApi;
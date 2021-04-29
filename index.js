require('dotenv').config()
const Discord = require('discord.js');
const client = new Discord.Client();
prefix = process.env.prefix;

let vittime = [];
let connessioni = {};
let intervalli = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  //setInterval(tormenta, 1000);
});

client.on('message', msg => {
  if (!msg.content.startsWith(prefix)) return;
  comando = msg.content.split(' ');
  args = comando.splice(1);
  comando = comando[0].substring(1);

  console.log(`${msg.guild}: ${comando}`)

  switch (comando){
    case "tormenta":
        if (!args[0].match(/<@!?\d+>/)) return
        tag = args[0].match(/\d+/)[0];
        mittente = msg.member;
        //if (controllaRuolo(mittente)){
          membro = msg.guild.members.resolve(tag);
          eliminaAltrePersoneNelSuoServerDallaLista(membro);
          vittime.push(membro);
          connessioni[membro.id+""] = null;
          primaConnessione(membro);
        //}
      break;  
    case "shutup":
      mutaServer(msg.guild);
  }
});

client.on('voiceStateUpdate', (oldState, newState)=>{
  if (!vittime.includes(newState.member)) return;
  if (oldState.channel != newState.channel){  //quando la vittima cambia canale
    if (newState.channel){      //se posso mi collego
      newState.channel.join().then(connection=>{
        connessioni[`${newState.member.id}`] = connection;
      }).catch(error=>{
        console.log(error);
      });
    }else{                      //se la vittima è uscita mi scollego
      oldState.channel.leave();
    }
  }
  try{
    if (newState.mute){
      newState.guild.voice.setSelfMute(true);
    }else{
      newState.guild.voice.setSelfMute(false);
    }
  }catch(e){}
});


client.login(process.env.token);

function controllaRuolo(persona){
  if (persona.roles.cache){  //se il mittente ha ruoli
    if (persona.roles.cache.find(r => r.name === "botCommander")){ //se il  mittente ha  il ruolo botCommander   TODO: comando per aggiungere ruoli
      return true;
    }
  }
  return false;
}
function primaConnessione(membro){
  if (membro.voice.channel){
    membro.voice.channel.join().then(connection=>{
      connessioni[`${membro.id}`] = connection;
    }).catch(error=>{
      console.log(error);
    });
  }else{
    if (membro.guild.voice){
      if (membro.guild.voice.channel){
        membro.guild.voice.channel.leave();
      }
    }
  }
}
function eliminaAltrePersoneNelSuoServerDallaLista(persona){
  for (i=0;i<vittime.length;i++){
    if (vittime[i].guild == persona.guild){
      rimosso = vittime.splice(i,1)[0];
      delete connessioni[`${rimosso.id}`];
      i--;
    }
  }
}
function mutaServer(server){
  for (i=0;i<vittime.length;i++){
    if (vittime[i].guild == server){
      rimosso = vittime.splice(i,1)[0];
      delete connessioni[`${rimosso.id}`];
      try{
        server.voice.channel.leave();
      }catch(e){}
      return;
    }
  }
}
client.on('guildMemberSpeaking', (member, speaking) => {
  try{
    if (vittime.includes(member)){
      if (speaking.bitfield == 1){
        if (connessioni[member.id+""]){
          connessioni[member.id+""].play('./Carducci.ogg');
        }
        intervalli[member.id+""] = setInterval(()=>{
          if (connessioni[member.id+""]){
            connessioni[member.id+""].play('./Carducci.ogg');
          }
        },1000);
      }else{
        if (intervalli[member.id+""]){
          clearInterval(intervalli[member.id+""]);
        }
      }
    }
  }catch(e){}
});
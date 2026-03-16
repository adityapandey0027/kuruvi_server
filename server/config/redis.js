import IORedis from "ioredis";

let connection;

if(process.env.REDIS_URL){
    console.log("Connecting to redis via url")
    connection = new IORedis(process.env.REDIS_URL,{
        maxRetriesPerRequest : null,
        enableReadyCheck : false
    })
}else{
    console.log("Connecting to local redis...");
    connection = new IORedis({
        host : "127.0.0.1",
        port : 6379,
        maxRetriesPerRequest : null
    })
}

connection.on("connect", ()=> {console.log("Redis is connected successfully")});
connection.on("error", (err)=>{ console.log("Redis connection error", err)});

export default connection;
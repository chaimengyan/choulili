// 启动服务器
const express = require("express")
const app = express()
const router = require("./router")
const userRouter = require("./userRouter")
//引入express-session
const session = require("express-session")
// 获取post请求体数据
const bodyParser = require("body-parser")

const server = require("http").createServer(app)
const io = require("socket.io")(server)

const model = require("./mongod.js")
const objectId = require("mongodb").ObjectId

app.use(bodyParser.json({limit:'1000mb'}))
app.use(bodyParser.urlencoded({ limit:'1000mb',extended: true }))
// 公开文件
app.use("/public/",express.static("./public/"))
app.engine("html",require("express-art-template"))


// 配置session
app.use(session({
    secret:"keyboard cat",
    resave:false,
    saveUninitialized:true
}))



//挂载路由
app.use(router)
app.use(userRouter)


let arr = []
let manarr = []
// 客服端连接服务器
io.on("connection",socket=>{

    // 保存用户id
    socket.on('user', (data) => {
        let socketObj = {}
        var id = data.id
        socketObj.id = id
        socketObj.socket = socket
        arr.push(socketObj)
        let newarr = []
        for(let i in arr){
            
            newarr.push(objectId(arr[i].id))
        }
        io.emit("users",{newarr})
        
        
    })
    // 保存管理员id
    socket.on("manauser",(data)=>{
        let socketObj = {}
        var id = data.id
        socketObj.id = id
        socketObj.socket = socket
        manarr.push(socketObj)
        let newarr = []
        for(let i in arr){
            newarr.push(objectId(manarr[i].id))
        }
        io.emit("manas",{newarr})
    })
    
    // 给指定客户发送信息
    socket.on("sendMessage",(data)=>{
        let toid = data.toid
        let val = data.val
        let id = data.id
        let newarr = arr.concat(manarr)
        for(let i in newarr){
            let num = newarr[i].id 
            if(num === toid){
                newarr[i].socket.emit("reloveMessage",{data,sure:true})
            }
            if(num === id){
                newarr[i].socket.emit("reloveMessage",{data,sure:false})
                
            }
        }
       
        
        
        
    })
    // 监听用户断开
    socket.on("disconnect",(socket)=>{
        console.log("用户断开")
        for(let i in arr){
            if(arr[i].socket == socket){
                arr.splice(arr.indexOf(arr[i]),1)
            }
        }
        for(let i in manarr){
            if(manarr[i].socket == socket){
                manarr.splice(manarr.indexOf(manarr[i]),1)
            }
        }
        
    })
})


server.listen(9000,function(){
    console.log("running....")
})



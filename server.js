const http = require("http")
const moment = require("moment");
const express = require('express');
const app = express()
app.use(express.static('src'))
const server = require('http').createServer(app);
const io = require('socket.io')(server);
server.listen(8080, function () {
    console.log("node server run at " + 'http://localhost:8080');
})
const userInfoList = [];
const roomList = [];
const messageList = [];
io.on("connection", function (socket) {

    console.log("用户建立连接进入客厅");
    socket.on("message", function (message) {
        console.log("接收到消息", message);
        message.time = moment().format('yyyy-MM-DD hh:mm:ss');
        messageList.push(message)
        io.emit("message", message) //全频道信息发送 
    })
    socket.on("login", function (userInfo) {

        if (userInfoList.some(u => u.name === userInfo.name && u.onLine === true)) {
            userInfo.repeat = true;
            socket.emit("login", userInfo) //用户登录重复名字判断
        } else {
            userInfo.id = socket.id
            userInfo.onLine = true
            if (userInfoList.every(user => user.name !== userInfo.name)) {
                userInfoList.push(userInfo)
                console.log("用户登录");
            } else {
                let oldUserIndex = userInfoList.findIndex(user => user.name === userInfo.name)
                userInfoList[oldUserIndex] = userInfo;
                console.log("用户再次登录");//替换之前登录的ID
            }
            io.emit("login", userInfo) //用户登录 
        }
    })
    socket.on("init", function (userInfo) {
        // 初始化房间以及在线用户信息
        io.emit("init", {
            user: userInfoList,
            room: roomList,
            message: messageList
        })
    })
    socket.on("disconnect", () => {
        if (userInfoList == null || userInfoList.length === 0) return
        const userIndex = userInfoList.findIndex(user => user.id === socket.id)
        userInfoList[userIndex].onLine= false;
        io.emit("loginOut", userInfoList[userIndex]) //退出登录
        console.log(userInfoList[userIndex].name+"退出登录");
    })
    socket.on("createRoom", function (roomInfo) {
        const allrooms = [...io.sockets.adapter.rooms]
        if (!allrooms.some(room => room[0] === roomInfo.roomName)) {
            roomInfo.message = "创建房间"
            io.emit("createRoom", roomInfo)
            //创建房间发送的消息
        } else {
            roomInfo.message = "加入房间"
            io.to(roomInfo.roomName).emit('createRoom', roomInfo);
            //加入房间发送的消息
        }
        socket.join(roomInfo.roomName) //创建或者加入
        console.log(io.sockets.adapter.rooms); //输出所有房间信息
    })
})
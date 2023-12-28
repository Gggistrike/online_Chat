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

    console.log("宇宙大帝连接进入客厅");
    socket.on("message", function (message) {
        console.log("收到群星发来的消息", message);
        message.time = moment().format('yyyy-MM-DD hh:mm:ss');
        messageList.push(message)
        io.emit("message", message) 
    })
    socket.on("login", function (userInfo) {

        if (userInfoList.some(u => u.name === userInfo.name && u.onLine === true)) {
            userInfo.repeat = true;
            socket.emit("login", userInfo) 
        } else {
            userInfo.id = socket.id
            userInfo.onLine = true
            if (userInfoList.every(user => user.name !== userInfo.name)) {
                userInfoList.push(userInfo)
                console.log("登录群星聊天系统成功");
            } else {
                let oldUserIndex = userInfoList.findIndex(user => user.name === userInfo.name)
                userInfoList[oldUserIndex] = userInfo;
                console.log("再次登录群星聊天系统成功");
            }
            io.emit("login", userInfo) 
        }
    })
    socket.on("init", function (userInfo) {
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
        io.emit("loginOut", userInfoList[userIndex]) 
        console.log(userInfoList[userIndex].name+"退出群星聊天系统");
    })
    socket.on("createRoom", function (roomInfo) {
        const allrooms = [...io.sockets.adapter.rooms]
        if (!allrooms.some(room => room[0] === roomInfo.roomName)) {
            roomInfo.message = "创建群星房间"
            io.emit("createRoom", roomInfo)
        } else {
            roomInfo.message = "加入群星房间"
            io.to(roomInfo.roomName).emit('createRoom', roomInfo);
        }
        socket.join(roomInfo.roomName) 
        console.log(io.sockets.adapter.rooms); 
    })
})

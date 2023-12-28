const app = new Vue({
    el: '#app',
    data() {
        return {
            images: [{
                    src: "/images/head-1.jpg",
                    class: 'active'
                },
                {
                    src: "/images/head-2.jpg",
                    class: 'unActive'
                },
                {
                    src: "/images/head-3.jpg",
                    class: 'unActive'
                },
                {
                    src: "/images/head-4.jpg",
                    class: 'unActive'
                },
                {
                    src: "/images/head-5.jpg",
                    class: 'unActive'
                },
            ],
            userInfo: {
                name: '',
                image: "/images/head-1.jpg",
                id: '',
                onLine: false,
                isInit: true
            },
            alter: {
                isShow: false,
                color: 'alert-info',
                Info: '登录成功！',
            },
            Allmessage: [],
            socket: null,
            main: true,
            userList: [],
            message: "",

        };
    },
    methods: {
        Toast(mes, type, time = 1500) {
            let {
                isShow,
                color,
                Info
            } = this.alter;
            Info = mes;
            color = type
            isShow = true;
            this.alter = {
                isShow,
                color,
                Info
            }
            setTimeout(() => {
                isShow = false;
                this.alter = {
                    isShow: false,
                    color: 'success',
                    Info: ''
                }
            }, time)
        },
        login() {
            if (this.userInfo.name == "") {
                this.Toast("请输入名字", "alert-danger");
                return;
            }
            this.socket.emit("login", {
                ...this.userInfo
            })
        },
        ChangeImgColor(i) {
            const newImages = this.images.map(image => {
                image.class = "unActive";
                return image
            })
            newImages[i]["class"] = "active"
            this.images = newImages;
            this.userInfo.image = newImages[i]["src"];

        },
        sendMessage() {
            const {
                message,
                userInfo
            } = this
            if (!message) return;
            this.socket.send({
                mes: message,
                userInfo
            })
            this.message = "";
        },
        CreateRoom() {
            if (e.target.nodeName.toLowerCase() !== "button") return
            if (e.target.innerText === "创建") {
                let roomName = window.prompt("请输入创建的房间名")
                if (roomName) {
                    this.socket.emit("createRoom", {
                        roomName,
                        ...userInfo
                    })
                }
            }
        }
    },
    mounted() {

        const socket = io.connect("/");
        this.socket = socket;

        socket.on("message", (mes) => {
            this.Allmessage.push(mes)

        })
        socket.on("login", (userInfp) => {
            if (userInfp["repeat"]  === true)
             {
                this.Toast(`用户：${userInfp.name},重复，请重新输入`, "alert-danger");   
            }else
            {
                if (this.userInfo.name !== userInfp.name) {
                    this.Toast(`用户${userInfp.name}上线了，快来和他聊天吧~`, "alert-info");
                } else {
                    this.Toast(`用户：${userInfp.name}，欢迎您`, "alert-info");
                    this.userInfo = userInfp
                    this.main = false;
                    socket.emit("init", JSON.stringify(this.userInfo))
                }
            }
         
        })
        socket.on("init", (initList) => {
            const {
                message,
                room,
                user
            } = initList;
            const MyIndex = user.findIndex(item => this.userInfo.id === item.id)
            user.splice(MyIndex, 1);
            this.userList = user
        })
        socket.on("createRoom", (roomInfo) => {
            console.log(roomInfo);
        })

        socket.on("loginOut", (userInfo) => {
            this.Toast(`用户${userInfo.name}已下线~`, "alert-info")
            let newList = this.userList.map(user => {
                if (user.name === userInfo.name) {
                    user.onLine = false;
                }
                return user
            })
            this.userList = newList
        })

    },
    beforeDestroy() {
        this.socket.emit("loginOut", this.userInfo)

    },
    computed: {
        countOline() {
            return '群聊(' + eval(this.userList.length + 1) + ")"
        }
    }
});
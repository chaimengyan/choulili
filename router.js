// 路由模块
const express = require("express")
const router = express.Router()
// 引入第三方加密包
const md5 = require("blueimp-md5")
// 获取数据库模块
const model = require("./mongod.js")
const fs = require("fs")
// 引入时间处理模块
const moment = require("moment")
// 引入处理ID模块
const objectId = require("mongodb").ObjectId
// 分页模块
const pagination = require("mongoose-sex-page")
// path模块
const path = require("path")
// 解析表单
const formidable = require("formidable")
const form = new formidable.IncomingForm()
form.uploadDir = path.join(__dirname,"public","uploads")
form.keepExtensions = true


router.get("/registered",function(res,rso){
     rso.render("register.html")
    
})
// 处理注册提交的信息
router.post("/rePost",function(res,rso){
    var newBody = {}
    newBody.username = res.body.username
    newBody.password = md5(md5(res.body.password)) //双层加密
    console.log(res.body.zhuce)
    model.User.findOne({username:res.body.username},function(err,ret){
        if(err){
            throw err
        }
        if(!ret){
            model.Mana.findOne({username:res.body.username},function(err,ret){
                if(err){
                    throw err
                }
                if(res.body.zhuce){
                    model.Mana.insertMany(newBody,function(err,ret){
                        if(err){
                            throw err
                        }
                        rso.send({co:1})
                        
                    })
                }else{
                    model.User.insertMany(newBody,function(err,ret){
                        if(err){
                            throw err
                        }
                            
                        rso.send({co:1})
                    })
                }
            })
        }else{
            rso.send({co:-1})
        }

        

    })

})

// 验证管理员密码
router.post("/manaPassword",function(res,rso){
    res.body.password = md5(md5(res.body.password))
    
    model.Password.findOne({password:res.body.passw},function(err,ret){
            if(err){
                    
                throw err
            }
            
            if(!ret){
                
                return rso.send({
                    co:0
                })
            }
        model.Mana.findOne({username:res.body.username,password:res.body.password},function(err,user){
            if(err){           
                throw err
            }
            
            if(!user){
                return rso.send({
                        co:-1 //表示服务器没有账号密码
                        })
            }  
                res.session.manaUser = user
                rso.send({
                    co:1  //表示服务器有账号密码
                        })
                        
        })
            
        })
            

})

// 获取登陆界面提交的数据，并在数据库检查

router.post("/mation",function(res,rso){
    
   res.body.password = md5(md5(res.body.password))

   model.User.findOne(
        res.body,
        function(err,user){
            if(err){
                
                throw err
            }
            if(!user){
               return rso.send({
                   co:-1 //表示服务器没有账号密码
               })
            }
            res.session.user = user
            
            rso.send({
                co:1  //表示服务器有账号密码
            })
            
        })
    

 

})




// 处理退出请求
router.get("/loginOut",function(res,rso){
    // 删除保存的user
    res.session.user = null
    rso.redirect("/")
})
router.get("/loginO",function(res,rso){
    // 删除保存的user
    res.session.manaUser = null
    rso.redirect("/")
})

// 发布请求
router.get("/release",function(res,rso){
    let page = res.query.page
    pagination(model.Rele).find().page(page).size(5).display(5).exec((err,ret)=>{
        rso.render("bookzixun.html",{
                    user:res.session.user,
                    zixun:ret
        })
    })

    
    
})
// 处理表单数据
router.post("/rele",function(res,rso){
        var date = new Date()
        let id = objectId(res.session.manaUser.id)
        var nowDate = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
        res.body.date = nowDate
        res.body.nickname = res.session.manaUser.nickname
        res.body.avatar = res.session.manaUser.avatar
        res.body.manaId = id
        // var imgCode = res.body.img
        // var base64Data = imgCode.replace(/^data:image\/\w+;base64,/, "")
        // var dataBuffer = new Buffer(base64Data,"base64")
        
        model.Rele.insertMany(res.body,function(err,ret){
            if(err){
                rso.send({
                    co:-1
                }) 
            }else{
                rso.send({
                    co:1
                })
            }
            
            
        })
        

})

// 接收个人信息请求
router.get("/personal",function(res,rso){
    rso.render("personal.html",{
        user:res.session.user
    })
})
router.post("/personal",function(res,rso){

    res.body.username = res.session.user.username
    var imgCode = res.body.avatar
    var base64Data = imgCode.replace(/^data:image\/\w+;base64,/, "")
    var dataBuffer = new Buffer(base64Data,"base64")
    
    
        model.User.findOne({nickname:res.body.nickname},function(err,ret){
            if(err){
                throw err
            }
            if(!ret){
                model.User.findOneAndUpdate({username:res.body.username},res.body,{new:true},function(err,ret){
                    //修改之后更新session的值
                   res.session.user = ret
                    
                    rso.json(ret)
                })
            }else{
                rso.send({
                    co:-1
                })
            }
        })
})

// 处理主题
router.get("/index",function(res,rso){
    
        model.User.findOneAndUpdate({username:res.session.user.username},{status:res.query.status},{new:true},function(err,ret){
            if(err){
                throw err
            }
            res.session.user.status = res.query.status
            rso.send()
        })
        
    
})
// 处理小方块颜色
router.get("/color",function(res,rso){
    model.User.findOne({username:res.session.user.username},function(err,ret){
        if(err){
            throw err
        }
        rso.send(ret)
    })



})



// 处理教材订购请求
router.get("/book",function(res,rso){
    
    rso.render("book.html",{
        user:res.session.user
        
    })
})

// 教材管理请求
router.get("/management",function(res,rso){
    rso.render("management.html",{
        manaUser:res.session.manaUser
        
    })    
        
  
})
// 请求用户数据
router.get("/user",function(res,rso){
let promise = new Promise(function(resolve,reject){
        model.User.find(function(err,ret){
            
            resolve(ret)
        })
    })
        promise.then((data)=>{
            var user = JSON.stringify(data)
            data = JSON.parse(user)
        model.Mana.find(function(err,manaUser){
            if(err){throw err}
                                
                rso.render("user.html",{
                    manaUser:res.session.manaUser,
                    allUser:data,
                    allMana:manaUser
                })    
        })

    },()=>{})
})

router.post("/off",function(res,rso){
    let id = objectId(res.body.id)
    let time = moment(Date.now()).format("YYYY/MM/DD HH:mm:ss" )
    model.Book.findOneAndUpdate({_id:id},{off:res.body.off,time:time},{new:true},function(err,ret){

        if(err){throw err}
        
        if(ret.off == 1){
            rso.send({
                co:1,
                time:ret.time
            })
        }
        if(ret.off == -1){
            rso.send({co:-1})
        }


    })


})




// 后台发布资讯
router.get("/allzixun",function(res,rso){
    
    model.Rele.find(function(err,ret){
        rso.render("allzixun.html",{
            manaUser:res.session.manaUser,
            allzixun:ret
        })
    })
        
    

})
// 删除某一条资讯
router.post("/alldelete",function(res,rso){
    let id = objectId(res.body.id)
    model.Rele.findOneAndDelete({_id:id},(err,ret)=>{
        if(ret){
            rso.send({co:1})
        }
    })
})
// 编辑某一条资讯
router.get("/updateNews",function(res,rso){
    let id = objectId(res.query.id)
    model.Rele.findOne({_id:id},(err,ret)=>{
        if(ret){
            rso.render("updateNews.html",{
                manaUser:res.session.manaUser,
                bianjis:ret
            })
        }
    })
})
// 修改编辑的这条资讯
router.post("/updateNews",function(res,rso){
    var date = new Date()
    let id = objectId(res.body.id)
    var nowDate = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
    res.body.newobj.date = nowDate
    model.Rele.findOneAndUpdate({_id:id},res.body.newobj,function(err,ret){
        if(err){throw err}
        rso.send({co:1})
    })
})






router.get("/information",function(res,rso){
  
        
        rso.render("information.html",{
            manaUser:res.session.manaUser,
        })
        
   
    
})
// 轮播页面
router.get("/lunbo",function(res,rso){
    model.Lunbo.find(function(err,ret){
        rso.render("lunbo.html",{
            manaUser:res.session.manaUser,
            allLunbo:ret
            
        })
    })
    
})
// 接收轮播图请求
var on = false
router.post("/lunbo",function(res,rso){
    let arrs = res.body.all
    var id
    // 定义开关变量
    
    // 创建promise
    let promise = new Promise(function(resolve,reject){
        // 遍历数组
    for(let i in arrs){
        var imgCode = arrs[i].image
        var base64Data = imgCode.replace(/^data:image\/\w+;base64,/, "")
    //var dataBuffer = Buffer.alloc(base64Data,"base64")
         var dataBuffer = Buffer.alloc(11,base64Data,'base64')
    if(arrs[i].id === ""){
        model.Lunbo.insertMany({image:arrs[i].image})
        
    }else{
        id = objectId(arrs[i].id)
        model.Lunbo.findOneAndUpdate({_id:id},{image:arrs[i].image},function(err,ret){
            if(err){throw err}
            if(ret){
                // if(i >= arrs.length-1){
                //     rso.send({co:1})
                // }
                on = true
                resolve(on)
            }
            
        })
    }

}


    })

    promise.then((data)=>{
        if(on === true){
            rso.send({co:1})
        }
    },()=>{})
 
})

// 删除轮播图图片
router.post("/removeLunbo",function(res,rso){
    if(res.body.id ==""){
        rso.send({co:-1})
    }
    let id = objectId(res.body.id)
    model.Lunbo.findOneAndDelete({_id:id},function(err,ret){
        if(err){throw err}
        if(ret){
            rso.send({co:1})
        }
    })


})
// 后台个人信息
router.get("/people",function(res,rso){
  
    rso.render("people.html",{
        manaUser:res.session.manaUser,
        
    })
    


})
// 修改个人信息
router.post("/people",function(res,rso){
    var imgCode = res.body.avatar
    var base64Data = imgCode.replace(/^data:image\/\w+;base64,/, "")
    var dataBuffer = new Buffer(base64Data,"base64")
    
    model.Mana.findOne({nickname:res.body.nickname},function(err,ret){

        if(err){throw err}
        if(!ret){

            
            model.Mana.findOneAndUpdate({username:res.session.manaUser.username},res.body,{new:true},function(err,ret){
                if(err){throw err}

                res.session.manaUser = ret
                rso.json(ret)
            })

        }else{
            rso.send({
                co:-1
            })
        }




    })
    
    
    
})

// 后台上架图书
router.get("/manaBook",function(res,rso){
    rso.render("manaBook.html",{
        manaUser:res.session.manaUser,
        
    })
})

// 接收上架的教材
router.post("/Upload",function(res,rso){
    let date = new Date()
    res.body.time = moment(Date.now()).format("YYYY/MM/DD HH:mm:ss" )
    
    model.Book.insertMany(res.body,function(err,ret){
        if(err){throw err}
        console.log("添加成功")
        rso.send({co:1})
    })
})
// 修改教材请求
router.get("/manaUp",function(res,rso){
    model.Book.find(function(err,ret){
        if(err){throw err}
        if(JSON.stringify(ret) === "[]"){

          return  rso.send({co:-1})

        }
        rso.render("manaUp.html",{
            manaUser:res.session.manaUser,
            bookMain:ret
            
        })
    })
    
})

// 查看分类请求 文学类
router.get("/literature",function(res,rso){

    model.Book.find({maxClass:"文学"},function(err,ret){
        if(err){throw err}
        if(JSON.stringify(ret) === "[]"){

            return  rso.send({co:-1})
  
          }
        rso.render("literature.html",{
            manaUser:res.session.manaUser,
            literature:ret
        })
    })



})
// 编程类请求
router.get("/program",function(res,rso){
    model.Book.find({maxClass:"编程"},function(err,ret){
        if(err){throw err}
        if(JSON.stringify(ret) === "[]"){

            return  rso.send({co:-1})
  
          }
        rso.render("program.html",{
            manaUser:res.session.manaUser,
            program:ret
        })
    })
})

// 后台新增用户
router.get("/peopleUp",function(res,rso){
    rso.render("peopleUp.html",{
        manaUser:res.session.manaUser
        
    })
})
// 后台添加新用户
router.post("/peopleUp",function(res,rso){
    res.body.password = md5(md5(res.body.password))
    if(res.body.code == -1){
        model.User.findOne({username:res.body.username},function(err,ret){
            if(err){throw err}
            if(!ret){
                model.User.insertMany(res.body,function(err,ret){
                    // 添加成功
                    rso.send({co:1})
                })
            }else{
                rso.send({co:-1})
            }
        })
    }
    if(res.body.code == 1){
        model.Mana.findOne({username:res.body.username},function(err,ret){
            if(err){throw err}
            if(!ret){
                model.Mana.insertMany(res.body,function(err,ret){
                    // 添加成功
                    rso.send({co:1})
                })
            }else{
                rso.send({co:1})
            }
        })

    }
})

// 后台删除用户
router.post("/removeUser",function(res,rso){
    
    if(res.body.code == 1){
        model.Mana.findOneAndDelete({username:res.body.username},function(err,ret){
            if(err){throw err}
            rso.send({co:1})
        })
    }else if(res.body.code == -1){
        model.User.findOneAndDelete({username:res.body.username},function(err,ret){
            if(err){throw err}
            rso.send({co:1})
        })
    }



})
// 后台更新页面的请求
router.get("/update",function(res,rso){
    if(res.query.code == 1){
        model.Mana.findOne({username:res.query.username},function(err,ret){
            if(err){throw err}
            
            rso.render("updateuser.html",{
                manaUser:res.session.manaUser,
                ups:ret
            })
        })
    }else if(res.query.code == -1){
        model.User.findOne({username:res.query.username},function(err,ret){
            if(err){throw err}
            rso.render("updateuser.html",{
                manaUser:res.session.manaUser,
                ups:ret
            })
        })
    }
})
// 后台修改用户
router.post("/update",function(res,rso){
    res.body.newP.password = md5(md5(res.body.newP.password))
    let newUsername = res.body.newP.username
    let oldUsername = res.body.oldUsername
    if(res.body.newP.code == 1){
        
         model.Mana.findOne({username:newUsername},function(err,ret){
          
            if(err){throw err}
            
            if(!ret){
                if(res.body.cod == -1){
                    model.User.findOneAndDelete({username:oldUsername},function(){
                        model.Mana.insertMany(res.body.newP,function(){
                            rso.send({co:1})
                        })
                    })
                }else{
                    model.Mana.findOneAndUpdate({username:oldUsername},res.body.newP,function(err,ret){
                        if(err){throw err}
                        rso.send({co:1})
                    })
                }
                
            }else{
                rso.send({co:-1})
            }
         })
        
    }
    else if(res.body.newP.code == -1){
        
        model.User.findOne({username:newUsername},function(err,ret){
            if(err){throw err}
            
            if(!ret){
                if(res.body.cod == 1){
                    model.Mana.findOneAndDelete({username:oldUsername},function(){
                        model.User.insertMany(res.body.newP,function(){
                            rso.send({co:1})
                        })
                    })
                }else{
                    model.User.findOneAndUpdate({username:oldUsername},res.body.newP,function(err,ret){
                        if(err){throw err}
                        rso.send({co:1})
                    })
                }
                
            }else{
                
                rso.send({co:-1})
            }
            
        })
        
    }



})

// 后台教材编辑页面请求
router.get("/editBook",function(res,rso){
    let id = objectId(res.query.id)
    
    model.Book.findOne({_id:id},function(err,ret){
        
        if(err){throw err}
        rso.render("editBook.html",{
            manaUser:res.session.manaUser,
            edits:ret,
            wenxueClass:res.query.minClass.wenxue,
            bianchengClass:res.query.minClass.biancheng
        
        })
        
    })


})
// 修改教材的请求数据
router.post("/editBook",function(res,rso){
    let date = new Date()
    res.body.newObj.time = moment(Date.now()).format("YYYY/MM/DD HH:mm:ss" )
    let id = objectId(res.body.id)
    model.Book.findByIdAndUpdate({_id:id},res.body.newObj,function(err,ret){
        if(err){throw err}
        rso.send({co:1})
    })

})

// 删除教材
router.post("/removeBook",function(res,rso){
    let id = objectId(res.body.id)

    model.Book.findOneAndDelete({_id:id},function(err,ret){
        if(err){throw err}
        rso.send({co:1})
    })


})
// 后台订单请求
router.post("/manaOrder",(res,rso)=>{
    model.Order.find().populate("bookId.bookid.bookid userid").then(result=>{
            var user = JSON.stringify(result)
            result = JSON.parse(user)
                rso.render("ordered.html",{
                    manaUser:res.session.manaUser,
                    allOrder:result
                    
                })

    })

})
router.post("/neworder",(res,rso)=>{
    model.Order.find().populate("bookId.bookid.bookid userid").then(result=>{
            var user = JSON.stringify(result)
            result = JSON.parse(user)
            rso.render("neworder.html",{
                manaUser:res.session.manaUser,
                allOrder:result
            })
        
    })





})

// 处理发货请求
router.post("/ordering",(res,rso)=>{
    let orderNum = parseInt(res.body.orderNum)
    let id = objectId(res.body.id)
    let date = new Date()
    let deliTime = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
    
    model.Order.findOneAndUpdate({userid:id,"bookId.orderNum":orderNum},{$set:{"bookId.$.deliTime":deliTime}},{new:true},function(err,ret){
        if(err){throw err}
        
        rso.send({co:1})


    })

})

//渲染评论请求
router.post("/Replay",(res,rso)=>{
    let id = objectId(res.body.bookid)
    
    model.Comment.find({bookID:id}).populate("comment.fromID comment.toID.toid comment.toID.manaid").then(result=>{
        let use = JSON.stringify(result)
        result = JSON.parse(use)
        
        if(JSON.stringify(result) === "[]"){
            rso.send({co:-1})
        }else{
            rso.render("replay.html",{
                manaUser:res.session.manaUser,
                replays:result
             })
        }
         
     
     })
})
// 后台评论回复
router.post("/manaComment",(res,rso)=>{
    let date = new Date()
    let bookID = objectId(res.body.id)
    let time = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
    let content = res.body.val
    let fromID = res.session.manaUser._id
    let identity = res.body.identity
    
        let atval = res.body.atval
        let obj = {
            manaid:fromID,
            tocon:content,
            time,
            atval,
            identity
        }
       
        let id = objectId(res.body.user)
        model.Comment.findOneAndUpdate({bookID,"comment._id":id},{$push:{"comment.$.toID":obj}},(err,ret)=>{
            rso.send({co:1})
        })
    
})

// 删除某一条评论
router.post("/deleteReplay",(res,rso)=>{
    let index = parseInt(res.body.index)
    let id = objectId(res.body.id)
    let bookID = objectId(res.body.bookid)
    if(index === 1){
        // 主评论
    
        model.Comment.findOneAndUpdate({bookID,"comment._id":id},{$pull:{comment:{_id:id}}},(err,ret)=>{
            
             rso.send({co:1})
        })
    }

    if(index === -1 || index === 0){
        // 子评论
        
        model.Comment.findOneAndUpdate({bookID,"comment.toID._id":id},{$pull:{"comment.$.toID":{_id:id}}},(err,ret)=>{
            
            rso.send({co:1})
       })
    }
    

})

// 渲染所有的用户上线列表
router.post("/userlist",(res,rso)=>{
    let arr = res.body.arr
    for(let i in arr){
        arr[i] = objectId(arr[i])
    }
    model.User.find({_id:{$in:arr}},(err,ret)=>{
        let use = JSON.stringify(ret)
        ret = JSON.parse(use)
        rso.render("manamsg.html",{
            userlist:ret
        })

    })
})



module.exports = router
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

// 客户端首页
router.get("/", async (res,rso)=>{
    
    let ret = await model.Lunbo.find()
    let uu = await model.Book.find().sort({browse:-1}).limit(5)
    let ee = await model.Rele.find()
    if(!res.session.user){
        rso.render("userIndex.html",{
            allBook:uu,
            lunbo:ret,
            zixun:ee
        })
    }else{
        rso.render("userIndex.html",{
            user:res.session.user,
            allBook:uu,
            lunbo:ret,
            zixun:ee
            
        })
    }

})
// 验证用户是否登陆
router.get("/usered",(res,rso)=>{
    if(res.session.user){
        rso.send({co:1})
    }
})



// 请求登陆页面
router.get("/login",function(res,rso){
    rso.render("index.html")
})
// 点击换一换
router.get("/changeBook",async (res,rso)=>{
    let all = await pagination(model.Book).find().page().size().display().exec()
    let total = all.total
    let index = Math.floor(Math.random()*total)
    let uu = await model.Book.find().skip(index).sort({browse:-1}).limit(5)
    rso.render("change.html",{
        allBook:uu
    })
})
// 全部课程的请求
router.get("/allcourse",async function(res,rso){
    let page = res.query.page
    
        if(res.query.index){
            let i = parseInt(res.query.index)
            if(i === 1){
                // 浏览量排序
                
                let result = await pagination(model.Book).find({off:1}).sort({browse:-1}).page(page).size(8).display(3).exec()
                fun2(result)
            }else
            if(i === 2){
                // 销量排序
                
                let result = await pagination(model.Book).find({off:1}).sort({sales:-1}).page(page).size(8).display(3).exec()
                fun2(result)
            }else
            if(i === 3){
                // 收藏排序
               
                let result = await pagination(model.Book).find({off:1}).sort({favorite:-1}).page(page).size(8).display(3).exec()
                fun2(result)
    
            }
        }else{
            let result = await pagination(model.Book).find({off:1}).sort({sales:-1}).page(page).size(8).display(3).exec()
            fun(result)
        }
    
    
    
    
    // 渲染函数
    function fun (result){
        if(!res.session.user){
            rso.render("allcourse.html",{
                allBook2:result
            })
        }else{
            rso.render("allcourse.html",{
                user:res.session.user,
                allBook2:result
            })
        }
    }
    function fun2 (result){
        if(!res.session.user){
            rso.render("fl.html",{
                allBook2:result
            })
        }else{
            rso.render("fl.html",{
                user:res.session.user,
                allBook2:result
            })
        }
    }

   
})
// 课程 模糊查询
router.get("/bookSearch",async (res,rso)=>{
    let key = res.query.val
    let page = res.query.page
    let reg = new RegExp(key,'i')   // 正则表达式，必须使用实例
                                    // 不可以用 / / 
     let obj = {$or:[        //$or: 操作符后跟一个数组，表示数组里面的条件是或的关系
        {bookName:{$regex : reg}},//$regex 用于模糊查询
        {class:{$regex : reg}}
    ]}
    
    // 整个对象就是查询条件
    let result = await pagination(model.Book).find(obj,{off:1}).page(page).size(8).display(3).exec()
    rso.render("allcourse.html",{
        user:res.session.user,
        allBook2:result
    })

})


// 课程资讯详情
router.post("/details",function(res,rso){
    let id = objectId(res.body.id)
    model.Rele.findOne({_id:id},function(err,ret){
        let brw = ret.browse + 1
        model.Rele.findOneAndUpdate({_id:id},{browse:brw},function(err,ret){
        })
        rso.render("details.html",{
            user:res.session.user,
            massage:ret,
            len:ret.length
        })
    })


})


// 资讯模糊查询
router.get("/search",function(res,rso){
    
    let key = res.query.val
    let reg = new RegExp(key,'i')
    let obj = {$or:[
        {title:{$regex : reg}},
        {main:{$regex : reg}},
        {date:{$regex : reg}}

    ]}
    let page = res.query.page
    pagination(model.Rele).find(obj).page(page).size(5).display(3).exec((err,ret)=>{

        rso.render("bookzixun.html",{
                user:res.session.user,
                zixun:ret
            })


    })
    
})

// 接收教材详情页请求
router.get("/shoping",function(res,rso){
    let id = objectId(res.query.id)
    let browse= parseInt(res.query.browse) + 1
    model.Book.findOne({_id:id},function(err,ret){
        if(err){throw err}
        model.Book.findOneAndUpdate({_id:id},{browse:browse},function(err,br){
            model.Comment.find({bookID:id}).populate("comment.fromID comment.toID.toid comment.toID.manaid").then(result=>{
                let use = JSON.stringify(result)
                result = JSON.parse(use)
                
                rso.render("book.html",{
                    user:res.session.user,
                    book:ret,
                    com:result
                    
                })

            })

        })

    })
})
// 渲染评论
router.get("/com", async (res,rso)=>{
    let id = objectId(res.query.id)
    model.Comment.find({bookID:id}).populate("comment.fromID comment.toID.toid comment.toID.manaid").then(result=>{
        let use = JSON.stringify(result)
        result = JSON.parse(use)
        
        rso.render("comment.html",{
             user:res.session.user,
             com:result
        })
    })
})  




// 按分类查询课程
router.get("/cour",async function(res,rso){
    let page = res.query.page
    let result = await pagination(model.Book).find({off:1,class:res.query.class}).page(page).size(8).display(3).exec()
    rso.render("allcourse.html",{
        user:res.session.user,
        allBook2:result
    })


})

// 我的收藏页面请求
router.get("/mycollect",function(res,rso){
    if(res.session.user){
        //登陆
            rso.render("mycollect.html",{
                user:res.session.user
            })

    }else{
        //未登录
        rso.send({co:-1})
    }
    


})
// 提交我的收藏
router.post("/mycollect",function(res,rso){
    let user = res.session.user
    let bookids = objectId(res.body.bookid)
    let fa = parseInt(res.body.favorite) + 1 
    let id = res.body.id
    if(res.session.user){
        model.User.findOneAndUpdate({username:user.username},{ $push:{collect:{bookid:id}}},{new:true},function(err,ret){

            res.session.user = ret
            if(err){throw err}
            rso.send({co:1})
        })
    
        model.Book.findOneAndUpdate({_id:bookids},{favorite:fa},{new:true},(err,ret)=>{
            res.session.user = ret
        })
    }else{
        rso.send({co:-1})
    }
    

})

// 获取所有收藏的书id
router.get("/collects",function(res,rso){
    let arr = res.query.ids
    let newarr = []
    let id = 0
    for(let i in arr){
        id = objectId(arr[i])
        newarr.push(id)
    }
    model.Book.find({_id:{$in:newarr}},function(err,ret){
        
        rso.render("mycollect.html",{
            user:res.session.user,
            bookss:ret
        })
    })



})

// 取消收藏的请求
router.get("/removecoll",function(res,rso){
    let id = res.query.removeID
    
    let bookids = objectId(res.query.bookid)
    let fa = parseInt(res.query.favorite) - 1 
    model.User.findOneAndUpdate({username:res.session.user.username},{$pull:{collect:{bookid:id}}},{new:true},function(err,ret){
            res.session.user = ret
            rso.send({co:1})

    })
    model.Book.findOneAndUpdate({_id:bookids},{favorite:fa},{new:true},(err,ret)=>{

        res.session.user = ret
    })
        


})

// 购物车页面请求
router.get("/shop",function(res,rso){
    if(!res.session.user){
        rso.send({co:-1})
    }else{
        rso.render("shop.html",{
            user:res.session.user
        })


    }
})
// 添加购物车
router.post("/shop",function(res,rso){
    let user = res.session.user
    let id = res.body.id
    let num = res.body.num
    if(res.session.user){
        model.User.findOneAndUpdate({username:user.username},{ $push:{shop:{bookid:id,num:num}}},{new:true},function(err,ret){
            res.session.user = ret
            if(err){throw err}
            rso.send({co:1})
        })
    }else{
        rso.send({co:-1})
    }
    

})

router.get("/shopids",function(res,rso){
    let arr = res.query.ids
    
    let newarr = []
    
    let id = 0
    for(let i in arr){
        id = objectId(arr[i])
        newarr.push(id)
    }
    
    model.Book.find({_id:{$in:newarr}},function(err,ret){
        
        rso.render("shop.html",{
            user:res.session.user,
            shops:ret
        })
    })
})

// 删除购物车教材
router.post("/removeshop",function(res,rso){
    let id = res.body.id
    
    model.User.findOneAndUpdate({username:res.session.user.username},{$pull:{shop:{bookid:id}}},{new:true},function(err,ret){
            res.session.user = ret
            rso.send({co:1})

    })
})
// 添加订单之后清空购物车
router.post("/payshop",(res,rso)=>{
        let ids =  res.body.ids
            model.User.findOneAndUpdate({username:res.session.user.username},{$pull:{shop:{bookid:{$in:ids}}}},{new:true},function(err,ret){
                res.session.user = ret
                rso.send({co:1})
            })
})

// 修改保存购物车教材的数量
router.get("/num",function(res,rso){
    let bookid = res.query.id
    let num = res.query.num
    
    let swhere = {username:res.session.user.username,"shop.bookid":bookid}
    
    model.User.findOneAndUpdate(swhere,{$set:{"shop.$.num":num}},{new:true},function(err,ret){
        if(err){throw err}
        res.session.user = ret
        rso.render("shop.html",{
            user:res.session.user
        })
    })
})


// 验证提交个人信息
router.post("/personUpdate", async (res,rso)=>{
    let user = res.session.user
    let obj = res.body.obj
    let phone = parseInt(obj.phone)
    let address = obj.address
    let payPassword = md5(md5(obj.payPassword))
    let newobj = res.session.user
    newobj.phone = phone
    newobj.address = address
    newobj.payPassword = payPassword

        
    model.User.findOneAndUpdate({username:user.username},newobj,{new:true},function(err,ret){
        if(err){throw err}
        if(ret){
            rso.send({co:1})
        }else{
            rso.send({co:-1})
        }
        
                

    })
})

// 验证支付密码的正确性
router.post("/pay",async (res,rso)=>{
    let user = res.session.user
    let password = md5(md5(res.body.payPassword))
    model.User.findOne({username:user.username,"payPassword":password},(err,ret)=>{
        if(err){throw err}
        if(ret){
            rso.send({co:1})
        }else{
            rso.send({co:-1})
        }
    })


} )

// 接收教材id处理订单
router.post("/order",async (res,rso)=>{
    let newObj = {}
    let date = new Date()
    newObj.userid = objectId(res.session.user._id)
    
    let oldarr = res.body.arr
    let allpri = res.body.allpri
    let newarr  = res.body.arr2
    
    let date2 = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
    for(let i in oldarr){
        oldarr[i].bookid = objectId(oldarr[i].bookid)
        
    }
    
    let obj =
        {
            orderNum : Math.floor(Math.random()*1000000000000)+1,
            payTime :date2,
            bookid:oldarr,
            allpri
        }
    
    newObj.bookId=[
        obj
    ]
    // 修改销量
    let sales 
    for(let i in newarr){
      newarr[i].bookid = objectId(newarr[i].bookid)
      newarr[i].num = parseInt(newarr[i].num)
      newarr[i].sales = parseInt(newarr[i].sales)
      sales = newarr[i].num + newarr[i].sales
      model.Book.findOneAndUpdate({_id:newarr[i].bookid},{sales},function(err,ret){
        
        })
    }
    
    
    

    let promise = new Promise((reslove,reject)=>{
        model.Order.findOne({userid:newObj.userid},function(err,ret){
            if(err){throw err}
            if(!ret){
                reslove()
            }else{
                reject()
            }
            
        })
        
    })


    promise.then(()=>{
            model.Order.insertMany(newObj,function(err,ret){
                if(err){throw err}
                rso.send({co:1})
            })
    },()=>{
        model.Order.findOneAndUpdate({userid:newObj.userid},{$push:{bookId:obj}},function(err,ret){
            rso.send({co:1})
        })
    })





})

// 处理我的订单页面
router.get("/myorder",function(res,rso){
        if(!res.session.user){
            rso.send({co:-1})
        }else{

        let userid = objectId(res.session.user._id)
        model.Order.findOne({userid},function(err,ret){
            if(!ret){
                rso.render("myorder2.html",{
                    user:res.session.user,
                    
                })
                return
            }
        }).populate("bookId.bookid.bookid userid").then(result=>{
                var user = JSON.stringify(result)
                result = JSON.parse(user)
                rso.render("myorder.html",{
                    user:res.session.user,
                    allOrder:result
                })
            
        })

    }


})
// 删除订单的请求
router.post("/removeOrder",(res,rso)=>{
    let orderNum = parseInt(res.body.orderNum)
    let userid = objectId(res.session.user._id)
    
    model.Order.findOneAndUpdate({userid},{$pull:{bookId:{orderNum:orderNum}}},(err,ret)=>{
        if(ret){
            rso.send({co:1})
        }else{
            rso.send({co:-1})
        }
    })


})

// 评论提交 
router.post("/comment",(res,rso)=>{
    let date = new Date()
    let bookID = objectId(res.body.id)
    let time = moment(date.getTime()).format("YYYY/MM/DD HH:mm:ss" )
    let content = res.body.val
    let fromID = res.session.user._id
    
    if(res.body.user){
        let atval = res.body.atval
        let obj = {
            toid:fromID,
            tocon:content,
            time,
            atval
        }
        let toID = [
            obj
        ]
        // 进入判断表示回复其他人的评论
        
        let id = objectId(res.body.user)
        model.Comment.findOneAndUpdate({bookID,"comment._id":id},{$push:{"comment.$.toID":obj}},(err,ret)=>{
            rso.send({co:1})
        })
    }else{

   
    let obj = {
        fromID,
        content,
        time
    }
    let comment = [
        obj
    ]
    let newObj = {
        bookID,
        comment
    }

    let promise = new Promise((reslove,reject)=>{
        model.Comment.findOne({bookID},(err,ret)=>{
            if(!ret){
                reslove()
            }else{
                reject()
            }
        })



    })

    promise.then(()=>{
        model.Comment.insertMany(newObj,(err,ret)=>{
            rso.send({co:1})
        })    
    },()=>{
        model.Comment.findOneAndUpdate({bookID},{$push:{comment:obj}},()=>{
            rso.send({co:1})
        })
    })

} 

})
// 判断是否购买当前教材
router.get("/shoped",(res,rso)=>{
    let bookid = objectId(res.query.bookid)
    let userid = res.session.user._id
    model.Order.findOne({userid,"bookId.bookid.bookid":bookid},(err,ret)=>{
        if(err){throw err}
        if(!ret){
            rso.send({co:-1})
        }

    })
})
// 处理客户端个人信息页面

router.get("/myRele",function(res,rso){
    let userid = res.session.user._id
    model.User.findOne({_id:userid},function(err,ret){
        let user = JSON.stringify(ret)
        ret = JSON.parse(user)
        rso.render("myRele.html",{
            user:res.session.user,
            main:ret
        })
    })
})

// 客户端修改个人信息
router.post("/upUser",(res,rso)=>{
    let obj = res.body.obj
    let _id = res.session.user._id
    model.User.findOneAndUpdate({_id},obj,{new:true},(err,ret)=>{
        if(err){throw err}
        res.session.user = ret
        rso.send({co:1})
    })

})
// 修改密码页面请求
router.get("/updatePassword",(res,rso)=>{
    rso.render("password.html",{
        
    })
})
// 个人信息密码验证
router.post("/userUpdatePassword",(res,rso)=>{
    let password = md5(md5(res.body.passworded))
    let newPassword = md5(md5(res.body.password))
    let _id = res.session.user._id
    
    model.User.findOne({_id,password},(err,ret)=>{
        if(ret){
            model.User.findOneAndUpdate({_id},{password:newPassword},(err,ret)=>{
                if(ret){rso.send({co:1})}
            })
            
        }else{
            rso.send({co:-1})
        }
    })

})

// 练习我们页面请求
router.get("/sendMessage",(res,rso)=>{
    if(res.session.user){
        model.Mana.findOne((err,ret)=>{
            
            rso.render("endmessage.html",{
                user:res.session.user,
                mana:ret
            })
        })
        
    }else{
        rso.send({co:-1})
    }

})


module.exports = router
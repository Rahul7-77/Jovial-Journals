import { log } from "console";
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import session from "express-session";

const app =express();
const __dirname=dirname(fileURLToPath(import.meta.url));
let name;

app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret:'-1',
    resave: false,
    saveUninitialized: false,
}));
app.use(express.static("public"));

const db=new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"new-one",
    password:"nikhil2005",
    port:5432,
});
db.connect();

app.get('/',(req,res) =>{
    res.render("index.ejs");
})

app.post('/userlogin',async (req,res) => {
    let name=req.body.username;
    let password=req.body.userpassword;
    let result= await db.query("SELECT * FROM users WHERE username=$1 AND password=$2",[
        name,password
    ]);
    req.session.parentid=result.rows[0].user_id;
    console.log(req.session.parentid);
    // console.log(req.session.parentid);
    // console.log(result.rows[0].user_id);
    if(result.rows.length==0){
        res.redirect('/againlogin');
    }
    else{
        // console.log(req.session.parentid);
        res.render("loginhome.ejs");
    }
})

app.get('/logout',(req,res) => {
    req.session.destroy(err => {
        if(err){
            console.log(err);
            res.send("Error while logging out");
        }
        else{
            res.redirect('/');
        }
    })
    // res.redirect('/');
})

app.get('/loginpplhome',(req,res) => {
    if(req.session.parentid>0){
        res.render("loginhome.ejs");
    }
    else{
        res.redirect('/warning');
    }
})

app.get('/warning',(req,res) => {
    res.render("warning.ejs");
})

app.get('/register',(req,res) => {
    res.render("register.ejs");
})

app.get('/login',(req,res) => {
    res.render("login.ejs");
})

app.get('/success', async (req,res) => {
    let result=await db.query("SELECT * FROM storage");
    res.render("success.ejs",{entries:result.rows})
})

app.get('/loginsuccess', async (req,res) => {
    if(req.session.parentid>0){
        let result=await db.query("SELECT * FROM storage");
        res.render("loginsuccess.ejs",{entries:result.rows})
    }
    else{
        res.redirect('/warning');
    }
})

app.get('/newest',async (req,res) => {
    let result=await db.query("SELECT * FROM storage ORDER BY created_at DESC");
    // console.log(result.rows);
    res.render("loginsuccess.ejs",{entries:result.rows});
})

app.get('/oldest',async (req,res) => {
    let result=await db.query("SELECT * FROM storage ORDER BY created_at");
    // console.log(result.rows);
    res.render("loginsuccess.ejs",{entries:result.rows});
})

app.get('/newestnol',async (req,res) => {
    let result=await db.query("SELECT * FROM storage ORDER BY created_at DESC");
    // console.log(result.rows);
    res.render("success.ejs",{entries:result.rows});
})

app.get('/oldestnol',async (req,res) => {
    let result=await db.query("SELECT * FROM storage ORDER BY created_at");
    // console.log(result.rows);
    res.render("success.ejs",{entries:result.rows});
})

app.get('/add',(req,res) => {
    if(req.session.parentid>0){
        res.render("add.ejs");
    }
    else{
        res.redirect('/warning');
    }
})

app.get('/ind', async (req,res) => {
    if(req.session.parentid>0){
        let came_id=req.query.id;
        let result=await db.query("SELECT * FROM storage WHERE id = $1",[
            came_id
        ]);
        let com_result=await db.query(
            "SELECT comlikes.comment,username FROM comlikes INNER JOIN storage ON comlikes.main_id=storage.id INNER JOIN users ON comlikes.user_id=users.user_id WHERE storage.id = $1",[
            came_id
        ]);
        res.render("loginindividual.ejs",{entries:result.rows,coms:com_result.rows});
    }
    else{
        res.redirect('/warning');
    }
})

app.get('/nologintrying',(req,res) => {
    res.redirect('/login');
})

app.get('/againreg',(req,res) => {
    let msg=req.query.id;
    res.render("againregister.ejs",{message:msg});
})

app.get('/againlogin',(req,res) => {
    res.render("againlogin.ejs");
})

app.post('/searchtitle', async (req,res) => {
    let searchtext=req.body.searchtext;
    let s="wow"+searchtext;
    let result=await db.query("SELECT * FROM storage WHERE title LIKE $1",[
        "%"+searchtext+"%"
    ]);
    console.log(s);
    console.log(result.rows.length);
    res.render("loginsuccess.ejs",{entries:result.rows});
})

app.post('/searchtitlenol', async (req,res) => {
    let searchtext=req.body.searchtext;
    let s="wow"+searchtext;
    let result=await db.query("SELECT * FROM storage WHERE title LIKE $1",[
        "%"+searchtext+"%"
    ]);
    console.log(s);
    console.log(result.rows.length);
    res.render("success.ejs",{entries:result.rows});
})

app.post('/userreg',async (req,res) => {
    let name=req.body.username;
    let email=req.body.useremail;
    let password=req.body.userpassword;
    let flag1=false;
    let flag2=false;
    let checker=await db.query("SELECT * FROM users WHERE username=$1",[
        name
    ]);
    let checker2=await db.query("SELECT * FROM users WHERE email=$1",[
        email
    ]);
    console.log(checker.length);
    console.log(checker2.length);
    if(checker.rows.length>0){
        flag1=true;
    }
    if(checker2.rows.length>0){
        flag2=true;
    }
    if(flag1==true || flag2==true){
        if(flag1==true){
            // same username
            res.redirect('/againreg?id=name');
        }
        else{
            res.redirect('/againreg?id=email');
        }
    }
    else{
        console.log("coming");
        await db.query("INSERT INTO users (username,email,password) VALUES ($1,$2,$3)",[
            name,email,password
        ]);
        // await db.query("INSERT INTO usernamechecker(name) VALUES($1)",[
        //     name
        // ]);
        let result=await db.query("SELECT * FROM users WHERE username=$1 AND email=$2 AND password=$3",[
            name,email,password
        ]);
        req.session.parentid=result.rows[0].user_id;
        // console.log(req.session.parentid);
        res.redirect('/loginpplhome');
    }
})

app.get('/addsuccess',(req,res) => {
    if(req.session.parentid>0){
        res.render("addsuccess.ejs");
    }
    else{
        res.redirect('/warning');
    }
})

app.post('/addingjoke', async (req,res) => {
    if(req.session.parentid<=0){
        res.redirect('/warning');
    }
    let name=req.body.PersonName;
    let place=req.body.place.toLowerCase();
    let title=req.body.title;
    let joke=req.body.funnyStory;
    await db.query("INSERT INTO storage (name,place,story,title,user_id) VALUES ($1,$2,$3,$4,$5)",[
        name,place,joke,title,req.session.parentid
    ]);
    res.render("addsuccess.ejs");
})

app.post('/addcomment',async (req,res) => {
    if(req.session.parentid<=0){
        res.redirect('/warning');
    }
    let com_id=req.query.id;
    let comment=req.body.comment;
    await db.query("INSERT INTO comlikes (main_id,comment,user_id) VALUES ($1,$2,$3)",[
        com_id,comment,req.session.parentid
    ])
    // let result=await db.query("SELECT * FROM storage WHERE id = $1",[
    //     com_id
    // ]);
    // let all_com=await db.query(
    //     "SELECT comlikes.comment FROM comlikes INNER JOIN storage ON comlikes.main_id=storage.id WHERE storage.id = $1",[
    //         com_id
    //     ]
    // )
    // console.log(all_com.rows);
    // res.render("individual.ejs",{entries:result.rows,coms:all_com.rows});
    let com_id_s=com_id.toString();
    // let final_com_id_s='"'+com_id_s;
    // final_com_id_s=final_com_id_s+'"';
    res.redirect("/ind?id="+com_id_s);
})

app.listen(3000,() => {
    console.log("Server is running on port 3000");
})
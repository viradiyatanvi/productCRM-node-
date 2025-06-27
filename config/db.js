const mongoose=require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/productcrm');

const db=mongoose.connection;

db.once('open',(err)=>{
    if(err){
        console.log('db not connected');
        return false;
    }
    console.log('db is connected...');
})

module.exports=db;
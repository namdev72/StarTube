import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async ()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongodb connected !! db host: ${connectionInstance.connection.host}`);
        console.log(`\n mongodb connected !! db host: ${connectionInstance.connection.name}`);
        
    }
    catch(err){
        console.log("Mongodb connection error ",err);
        process.exit(1)
        
    }
}

export default connectDB
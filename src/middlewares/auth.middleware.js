import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

export const vertifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        //from header we gwt the toekn like Authentiion:Bearer <Token> so we replace the Beare woth space for we have the token with as
        const token=req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","")
        if(!token)
        {
            throw new ApiError(401,"Unauthorized request")
        }
        //we are vrifying the token
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user)
        {
            throw new ApiError(401,"Invalid Accesss token")
        }
    
        //adding the user field in req,
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})
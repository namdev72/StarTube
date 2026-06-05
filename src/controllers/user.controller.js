import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiRespone} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


//get user detail from frontend
    //validation for user data
    //not mepty validation 
    //check if use already exist (check with user name and email)
    //check for images and check of avatar
    //upload the cloudinary,check avatar
    //creat user object - create entry in db
    //remove the password and refresh token from response
    //check for user creation
    //return res

const registerUser=asyncHandler(async(req,res)=>{
    //taking the input 
    const {fullName,email,username,password }=req.body
    console.log("email:",email);

    if(
        [fullName,email,username,password].some(
            (field)=>!field?.trim()
        )
    ){
        throw new ApiError(400,"All field is required");
    }


    //check your exist or not
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email and username exist")
    }
    console.log(req.files);


    //check for images
    const avatarLocalpath=req.files?.avatar[0]?.path;
    //const coverImageLocalpath=req.files?.coverImage?.[0]?.path;
    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }
    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is required")
    }


    //upload to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalpath)
    const coverImage=coverImageLocalpath?await uploadOnCloudinary(coverImageLocalpath):null
    if(!avatar){
        throw new ApiError(400,"file is uploded");
    }


    //create the user in db and upload the detail
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })


    //created user detail and  remove the password and refresh token from response
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registing the user")
    }


    //now we will send respone
    //return res.status(201).json(createdUser)
    return res.status(201).json(
        new ApiRespone(201,createdUser,"user registered succesfully")
    )    
})


/////////////////method to generate access and refresh token///
//////////////////////////////////////////////////////////////
const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        //adding refersh token to db
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }
    catch(err){
        throw new ApiError(500,"some thiing went wrong while generating access and refresh token")
    }
}


////////////////////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////login user///////////


//req->body
//username or email 
//find the user in db
//password check
//access and refersh token generate
//send acces and refersh token in cookie
const loginUser=asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body
    if(!(username || email))
    {
        throw new ApiError(400,"username and password is required")
    }
    //find user in db
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user)
    {
        throw new ApiError(404,"User does not exist")
    }

    //checking password
    //User model me jo method bnae the vo instance user jo create kiya hai uus me available hai 
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(404,"password is invalid")
    }

    //access and refersh token 
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    //optional step creting the login in user
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    //send access and refresh toeken in cookie
    const option={
        httpOnly:true,
        secure:true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiRespone(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken
                },
                "user loggind in successfully"
            )
        )
})

//////////////////log out user///////////
//logout middleware

//remove the access and refresh token from cookie
//verify user middlware ke thourgh we added the user in req , so we have the access of user for logout
const logoutUser=asyncHandler(async(req,res)=>{
    //upadted the refresh token to undefined
    //removing from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new : true
        }
    )
    const option={
        httpOnly:true,
        secure:true
    }

    //removing from cookie
    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiRespone(200,{},"User Logged Out"))

})


//for genreating the refresh token after expiry
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
        if(!user)
        {
            throw new ApiError(401,"invalid refresh token")
        }
        //checking refresh token from user req and from db (from User.findby)
        if(incomingRefreshToken!==user?.refreshToken)
        {
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        //generate the new refresh token
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        const option={
            httpOnly:true,
            secure:true,
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newrefreshToken,option)
        .json(new ApiRespone(
            200,
            {accessToken,refreshToken:newRefreshToken},
            "Access token refreshed"
        ))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refersh token")
    }

})

export {registerUser,loginUser,logoutUser,refreshAccessToken}
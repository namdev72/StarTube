
import { Router } from "express";
import { loginUser, logoutUser, registerUser ,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload} from "../middlewares/multer.middleware.js";
import {vertifyJWT} from "../middlewares/auth.middleware.js"


const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)
router.route("refresh-token").post(refreshAccessToken)

//secure route
//we will add middle to verify the jwt  before logout
//verify user ke thourgh we added the user in req , so we have the access of user for logout
router.route("/logout").post(vertifyJWT, logoutUser)
router.route("/change-password").post(vertifyJWT,changeCurrentPassword)
router.route("/current-user").get(vertifyJWT,getCurrentUser)
router.route("/update-account").patch(vertifyJWT,updateAccountDetails)
router.route("/avatar").patch(vertifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(vertifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(vertifyJWT,getUserChannelProfile)
router.route("/history").get(vertifyJWT,getWatchHistory)

export default router
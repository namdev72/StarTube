
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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

//secure route
//we will add middle to verify the jwt  before logout
//verify user ke thourgh we added the user in req , so we have the access of user for logout
router.route("/logout").post(vertifyJWT, logoutUser)
export default router
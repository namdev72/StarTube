const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };
};



export {asyncHandler}

/*
//M-2

const asynchandler=(funs)=>async(req,res,next)=>{
    try{
        await funs(req,res,next)
    }
    catch(err)
    {
        res.status(err.code||500).json({
            success:false,
            message:err.message
        })
    }
}
*/
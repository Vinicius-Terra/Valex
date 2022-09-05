import { NextFunction, Request, Response } from "express";

export default function creatCardValidations (req: Request, res: Response, next: NextFunction) {
  
  const apikey = req.headers.apikey; 

  if(apikey){
    res.locals.apikey = apikey;
    next();
  } 
  else{
    // Unprocessable Entity
    throw({code:422, mensage:'No api key found in Headers'});
  }
  
}
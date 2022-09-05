import { NextFunction, Request, Response } from "express";

export default function errorHandler (error: any, req: Request, res: Response, next: NextFunction) {
  console.log(error);
  if (error.mensage) {
    return res.status(error.code).send(error.mensage);
  }
  else if(error.code){
    return res.sendStatus(error.code);
  }
  res.sendStatus(500); // internal server error
}
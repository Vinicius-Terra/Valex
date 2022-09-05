import { Request, Response } from "express";
import * as cardsService from "../services/cardsService";

export type TransactionTypes =
  | "groceries"
  | "restaurant"
  | "transport"
  | "education"
  | "health";

export async function creatCard(req: Request, res: Response) {
  const { cardType, employeeId } : {cardType: TransactionTypes, employeeId: number} = req.body;
  const  apiKey  : string = res.locals.apikey;

  const creatCardResult = await cardsService.creatCard(apiKey, cardType, employeeId);
  res.send(creatCardResult).status(200);
}

export async function activateCard(req: Request, res: Response) {
  const { employeeId, cardId, CVC, password } : {employeeId:number, cardId: number, CVC: string, password:string} = req.body;

  const activateCardResult = await cardsService.activateCard(employeeId, cardId, password, CVC);
  res.send(activateCardResult).status(200);
}

export async function showBalance(req: Request, res: Response) {
  const cardId:number = Number(req.params.cardId);

  console.log(cardId)
  const balance = await cardsService.showBalance(cardId);
  res.send(balance).status(200);
}

export async function findCards(req: Request, res: Response) {
  const cards = await cardsService.find();
  res.send(cards).status(200);
}

export async function rechargeCard(req: Request, res: Response) {
  const { amount, cardId} : {amount:number, cardId: number} = req.body;
  const  apiKey  : string = res.locals.apikey;

  const recharge = await cardsService.rechargeCard(cardId, amount, apiKey);
  res.send(recharge).status(200);
}

export async function makePurchase(req: Request, res: Response) {
  const { amount, cardId, businessId, password} : {amount:number, cardId: number, businessId: number, password:number} = req.body;

  const recharge = await cardsService.makePurchase(cardId, amount, businessId, password);
  res.send(recharge).status(200);
}


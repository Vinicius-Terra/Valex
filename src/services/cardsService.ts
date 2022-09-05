import { faker } from '@faker-js/faker';
import Cryptr from 'cryptr';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt'
import * as cardRepository from "../repositories/cardRepository";
import * as companyRepository from "../repositories/companyRepository";
import * as employeeRepository from "../repositories/employeeRepository";
import * as paymentRepository from "../repositories/paymentRepository";
import * as rechargeRepository from "../repositories/rechargeRepository";
import * as businessRepository from "../repositories/businessRepository";

export type TransactionTypes =
  | "groceries"
  | "restaurant"
  | "transport"
  | "education"
  | "health";

  export interface CardInsertData {
    employeeId: number;
    number: string;
    cardholderName: string;
    securityCode: string;
    expirationDate: string;
    password?: string;
    isVirtual: boolean;
    originalCardId?: number;
    isBlocked: boolean;
    type: TransactionTypes;
  }

  export interface Recharge {
    cardId: number;
    amount: number;
  }

export async function find() {
  const cards = await cardRepository.find();

  return cards;
}

export async function creatCard(apiKey:string,cardType:TransactionTypes,employeeId:number ) {
  const cryptr = new Cryptr('myTotallySecretKey');

  //validations
  const isApiKeyValid = await companyRepository.findByApiKey(apiKey);
  if(!isApiKeyValid) throw({code:404, mensage:'api key does not match any company'});

  const doesEmployeeExist = await employeeRepository.findById(employeeId);
  if(!doesEmployeeExist) throw({code:404, mensage:'Employee not registered'});

  const EmployeeAreadyHaveThisCard = await cardRepository.findByTypeAndEmployeeId(cardType, employeeId);
  if(EmployeeAreadyHaveThisCard) throw({code:409, mensage:'Employee aready have this card type'});
  // ---

  //formatting
  const cardNumber:string = faker.finance.account(8);
  const CVC:string = faker.finance.account(3);
  const encryptedCVC = cryptr.encrypt(CVC);
  const cardName:string = makeCardName(doesEmployeeExist.fullName)

  const cardData:CardInsertData ={
    employeeId,
    number: cardNumber,
    cardholderName: cardName,
    securityCode : encryptedCVC,
    expirationDate : (formatDate(new Date())),
    isVirtual: false,
    isBlocked: false,
    type: cardType,
  };

  return await cardRepository.insert(cardData);
}

export async function activateCard(employeeId: number, cardId: number, password: string, CVC: string) {
  const cryptr = new Cryptr('myTotallySecretKey');

  //validations
  const card = await cardRepository.findById(cardId);
  if(!card) throw({code:404, mensage:'Card does not exist'});

  const isCardExpired = dayjs().isBefore(dayjs(card.expirationDate, 'MM/YY'), 'month')
  if(isCardExpired) throw({code:403, mensage:'Card does not exist'});

  const doesCardAreadyHavePassword = card.password;
  if(doesCardAreadyHavePassword) throw({code:409, mensage:'Card aready is activate'});

  if (employeeId !== card.employeeId) throw ({code:409, mensage:'Card does not belong to this employee'});

  const decryptedCVC = cryptr.decrypt(card.securityCode);
  if(Number(CVC) !== Number(decryptedCVC)) throw({code:401, mensage:'Card CVC does not match'});

  if(password.toString().length !== 4) throw({code:422, mensage:'Password must have 4 charecters '})

  const hashedPassword = await bcrypt.hash(password.toString(), 7);
  return await cardRepository.update(cardId, { password: hashedPassword });
}

export async function showBalance(cardId: number) {
  const cryptr = new Cryptr('myTotallySecretKey');

  //validations
  const card = await cardRepository.findById(cardId);
  if(!card) throw({code:404, mensage:'Card does not exist'});

  //formatting
  let transactionsAmount:number;
  let rechargesAmount:number;
  const paymentData = await paymentRepository.findByCardId(cardId);
  const rechargeData = await rechargeRepository.findByCardId(cardId);

  const balance = calculateBalance(paymentData, rechargeData);

  return {balance, transactions:paymentData, recharges:rechargeData};
}

function calculateBalance(paymentData:Array<any>, rechargeData:Array<any>){

  if(!paymentData && !rechargeData) return {balance:0, transactions:[], recharges:[]};

  let paymentsAmount:number;
  let rechargesAmount:number;
  if(paymentData){
    paymentsAmount = paymentData.reduce(
      function(accumulator:number, currentVal:any){
        return accumulator + currentVal.amount
    }, 0)
  }
  else{
    paymentsAmount = 0;
  }

  if(rechargeData){
    rechargesAmount = rechargeData.reduce(
      function(accumulator, currentVal){
        return accumulator + currentVal.amount
    }, 0)
  }
  else{
    rechargesAmount = 0;
  }


  return rechargesAmount - paymentsAmount;
}

function makeCardName (FullName:string) {

  const Names: string[] = FullName.split(" ");
  let cardName:string = '';

  if(Names.length <= 2) 
    cardName = (Names.join(''));
  else{
    cardName = Names[0];
    for(let i=1; i < Names.length-1; i++){
      if(Names[i].length >= 3)
        cardName = cardName + ' ' + Names[i][0];
    }
    cardName = cardName + ' ' + Names[Names.length-1];
  }

  return cardName.toLocaleUpperCase();
}

function padTo2Digits(num:number) {
  return num.toString().padStart(2, '0');
}

function formatDate(date:Date) {
  return [
    padTo2Digits(date.getDate()),
    date.getFullYear() - 2000 + 5,
  ].join('/');
}

export async function rechargeCard(cardId: number, amount: number, apiKey: string) {

  //validations
  const card = await cardRepository.findById(cardId);
  if(!card) throw({code:404, mensage:'Card does not exist'});

  if(card.password === null) throw({code:404, mensage:'Card its not activate yet'});

  const isApiKeyValid = await companyRepository.findByApiKey(apiKey);
  if(!isApiKeyValid) throw({code:404, mensage:'api key does not match any company'});

  const isCardExpired = dayjs().isBefore(dayjs(card.expirationDate, 'MM/YY'), 'month')
  if(isCardExpired) throw({code:403, mensage:'Card does not exist'});
  //

  const rechargeData:Recharge = { cardId, amount };
  return await rechargeRepository.insert(rechargeData);
}

export async function makePurchase(cardId: number, amount: number, businessId: number, password: number) {

  //validations
  const card = await cardRepository.findById(cardId);
  if(!card) throw({code:404, mensage:'Card does not exist'});

  if(card.password === null) throw({code:404, mensage:'Card its not activate yet'});

  const isCardExpired = dayjs().isBefore(dayjs(card.expirationDate, 'MM/YY'), 'month')
  if(isCardExpired) throw({code:403, mensage:'Card does not exist'});

  if(card.isBlocked === true) throw({code:451, mensage:'This card is blocked'});

  const cardPassword = (card.password ? card.password.toString() : "error");
  const doesPasswordMatch = await bcrypt.compare(password.toString(), cardPassword);
  if(!doesPasswordMatch) throw({code:401, mensage:'Password invalid'});

  const Business = await businessRepository.findById(businessId);
  if(!Business) throw({code:404, mensage:'Business not found'});

  if(Business.type !== card.type) throw({code:403, mensage:'Business type and card type differ'});

  const paymentData = await paymentRepository.findByCardId(cardId);
  const rechargeData = await rechargeRepository.findByCardId(cardId);

  const balance = calculateBalance(paymentData, rechargeData);

  if(balance < amount) throw({code:400, mensage:'Insufficient balance'})
  //

  return await paymentRepository.insert({cardId, businessId, amount });
}

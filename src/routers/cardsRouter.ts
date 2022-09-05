import { Router } from "express";
import { creatCard, findCards, activateCard, showBalance, rechargeCard, makePurchase } from "../controllers/cardsController";
import  apiKeyValidation  from "../middlewares/apiKeyValidationMiddleware";
import  {validateSchema} from "../middlewares/schemaValidator"
import  {creatCardSchema, rechargeCardSchema, purchaseCardSchema} from "../schemas/cardSchemas"

const CardsRouter = Router();

CardsRouter.post("/creatCard", apiKeyValidation, validateSchema(creatCardSchema), creatCard);
CardsRouter.post("/recharge", apiKeyValidation, validateSchema(rechargeCardSchema), rechargeCard);
CardsRouter.post("/purchase", validateSchema(purchaseCardSchema), makePurchase);
CardsRouter.put("/activateCard", activateCard);
CardsRouter.get("/card", findCards);
CardsRouter.get("/balance/:cardId", showBalance);

export default CardsRouter;

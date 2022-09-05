import { Router } from "express";
import CardsRouter from "./cardsRouter";

const router = Router();
router.use(CardsRouter);

export default router;
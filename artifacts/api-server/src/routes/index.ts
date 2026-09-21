import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foodAnalysisRouter from "./food-analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foodAnalysisRouter);

export default router;

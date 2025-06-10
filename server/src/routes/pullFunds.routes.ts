import { Router } from "express";
import { sendPullFundsRequest, handlePullFundsRequest } from "../controller/pullFunds.controller";

const router = Router();

// Ruta para enviar solicitudes de pull funds a otros bancos
router.post("/enviar-pull-funds", (req, res, next) => {
    Promise.resolve(sendPullFundsRequest(req, res)).catch(next);
});

// Ruta para recibir solicitudes de pull funds de otros bancos
router.post("/pull-funds", (req, res, next) => {
    Promise.resolve(handlePullFundsRequest(req, res)).catch(next);
});

export default router;
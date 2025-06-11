import { Router, Request, Response, NextFunction } from "express";
import {
  checkUserSinpeLink,
  handleSinpeTransfer,
  validatePhone,
  receiveSinpeMovilTransfer,
  handleSinpeTransferWithAccount, // 🚨 NUEVA IMPORTACIÓN
} from "../controller/sinpe.controller";

const router = Router();

router.post(
  "/sinpe-movil",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handleSinpeTransfer(req, res)).catch(next);
  }
);

// Nueva ruta para recibir transferencias SINPE Móvil de otros bancos
router.post(
  "/sinpe-movil-transfer",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(receiveSinpeMovilTransfer(req, res)).catch(next);
  }
);

router.get(
  "/validate/:phone",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(validatePhone(req, res)).catch(next);
  }
);

router.get(
  "/sinpe/user-link/:username",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(checkUserSinpeLink(req, res)).catch(next);
  }
);

// 🚨 NUEVA RUTA para transferencias con cuenta específica
router.post(
  "/sinpe-transfer-from-account",
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handleSinpeTransferWithAccount(req, res)).catch(next);
  }
);

export default router;

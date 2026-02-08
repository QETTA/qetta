import { type Request, type Response, type NextFunction } from 'express';

/**
 * Row-Level Security: firm_id 기반 데이터 접근 제어
 * requirePartnerOrg 뒤에 체이닝
 */
export function firmRls(req: Request, res: Response, next: NextFunction): void {
  if (!req.firmAccount) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // firm_id를 쿼리/바디에 자동 주입 (다른 법인 데이터 접근 차단)
  req.query.firm_id = req.firmAccount.firm_id;
  next();
}

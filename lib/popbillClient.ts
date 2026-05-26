import popbill from 'popbill';

let initialized = false;

export function getPopbill() {
  if (!initialized) {
    popbill.config({
      LinkID: process.env.POPBILL_LINK_ID!,
      SecretKey: process.env.POPBILL_SECRET_KEY!,
      IsTest: false,
      defaultErrorHandler: () => {},
    });
    initialized = true;
  }
  return popbill;
}

export const CORP_NUM = process.env.POPBILL_CORP_NUM!;
export const SENDER_NUM = process.env.POPBILL_SENDER_NUM!;

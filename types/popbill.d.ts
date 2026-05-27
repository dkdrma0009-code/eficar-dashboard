declare module 'popbill' {
  interface PopbillConfig {
    LinkID: string;
    SecretKey: string;
    IsTest?: boolean;
    defaultErrorHandler?: (err: unknown) => void;
  }
  interface Popbill {
    config(cfg: PopbillConfig): void;
    MessageService(): MessageService;
    KakaoService(): KakaoService;
  }
  interface MessageService {
    sendSMS(
      corpNum: string, sender: string, receiver: string, receiverName: string,
      content: string, reserveDT: string | null, adsYN: boolean, requestNum: string | null,
      success: (result: { receiptNum: string }) => void,
      error: (err: { code: number; message: string }) => void,
    ): void;
    sendLMS(
      corpNum: string, sender: string, receiver: string, receiverName: string,
      subject: string, content: string, reserveDT: string | null, adsYN: boolean, requestNum: string | null,
      success: (result: { receiptNum: string }) => void,
      error: (err: { code: number; message: string }) => void,
    ): void;
    sendMMS(
      corpNum: string, sender: string, receiver: string, receiverName: string,
      subject: string, content: string, filePath: string,
      reserveDT: string | null, adsYN: boolean, requestNum: string | null,
      success: (result: { receiptNum: string }) => void,
      error: (err: { code: number; message: string }) => void,
    ): void;
    getBalance(corpNum: string, success: (bal: number) => void, error: (err: unknown) => void): void;
  }
  interface KakaoService {
    sendFTS_one(
      corpNum: string, plusFriendID: string, sender: string,
      receiver: string, receiverName: string, content: string,
      altContent: string, altSendType: string,
      reserveDT: string | null, adsYN: boolean, requestNum: string | null,
      success: (result: { receiptNum: string }) => void,
      error: (err: { code: number; message: string }) => void,
    ): void;
    listPlusFriendID(
      corpNum: string,
      success: (result: unknown[]) => void,
      error: (err: { code: number; message: string }) => void,
    ): void;
    getBalance(corpNum: string, success: (bal: number) => void, error: (err: unknown) => void): void;
  }
  const pb: Popbill;
  export = pb;
}

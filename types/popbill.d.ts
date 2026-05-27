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
  interface MsgSearchResult {
    code: number; total: number; perPage: number; pageNum: number; pageCount: number;
    list: Array<{
      receiptNum: string; requestNum: string; state: number; messageType: string;
      sendNum: string; receiveNum: string; receiveName: string;
      content: string; subject: string; sendDT: string; resultDT: string;
      result: string; resultMessage: string;
      imageURL?: string;
    }>;
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
    search(
      corpNum: string, sDate: string, eDate: string, msgTypes: string[],
      reserveYN: string | null, senderYN: string | null,
      page: number, perPage: number, order: string | null,
      success: (result: MsgSearchResult) => void,
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

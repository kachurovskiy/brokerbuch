import { describe, it, expect } from 'vitest'
import { parseSCNumber, parseTransactionFile, parseTime } from './parser';

describe('parser', () => {
  it('parseSCNumber', () => {
    expect(parseSCNumber('-7.104,00')).toEqual(-7104);
    expect(parseSCNumber('220,87')).toEqual(220.87);
    expect(parseSCNumber('0,00')).toEqual(0);
    expect(parseSCNumber('0')).toEqual(0);
    expect(parseSCNumber('1')).toEqual(1);
    expect(parseSCNumber('2.690,452')).toEqual(2690.452);
  });

  it('parseCsv', () => {
    const objects = parseTransactionFile(`date;time;status;reference;description;assetType;type;isin;shares;price;amount;fee;tax;currency
    2024-04-10;07:44:56;Pending;"HESGED2FIZEJCLKM";"PRIME+ subscription";Cash;Fee;;;;-4,99;0,00;;EUR
    2024-03-28;01:00:00;Executed;"52024001";"KKT-Abschluss";Cash;Interest;;;;-164,02;0,00;;EUR
    2024-02-27;18:34:09;Cancelled;"SCAL5z7RFZTfMex";"Marathon Digital";Security;Buy;US5657881067;0;0,00;0,00;0,00;0,00;EUR
    2024-02-14;01:00:00;Executed;"JXKPQR9REZV2LWRJSB7D7";"Scalable Capital Broker withdrawal";Cash;Withdrawal;;;;-142,00;0,00;;EUR
    2024-02-09;21:12:53;Executed;"SCALXiJuhi2MqSy";"Marathon Digital";Security;Sell;US5657881067;2;21,90;43,80;0,00;0,00;EUR`);
    expect(objects).toEqual({
      transactions: [
        {
          raw: '2024-02-09;21:12:53;Executed;"SCALXiJuhi2MqSy";"Marathon Digital";Security;Sell;US5657881067;2;21,90;43,80;0,00;0,00;EUR',
          time: parseTime('2024-02-09', '21:12:53'),
          status: "Executed",
          reference: "SCALXiJuhi2MqSy",
          description: "Marathon Digital",
          assetType: "Security",
          type: "Sell",
          isin: "US5657881067",
          shares: 2,
          price: 21.9,
          amount: 43.8,
          fee: 0,
          tax: 0,
          currency: "EUR",
          gainOrLoss: 0,
          sharesSold: 0,
        },
        {
          raw: '2024-02-14;01:00:00;Executed;"JXKPQR9REZV2LWRJSB7D7";"Scalable Capital Broker withdrawal";Cash;Withdrawal;;;;-142,00;0,00;;EUR',
          time: parseTime('2024-02-14', '01:00:00'),
          status: "Executed",
          reference: "JXKPQR9REZV2LWRJSB7D7",
          description: "Scalable Capital Broker withdrawal",
          assetType: "Cash",
          type: "Withdrawal",
          isin: "",
          shares: 0,
          price: 0,
          amount: -142,
          fee: 0,
          tax: 0,
          currency: "EUR",
          gainOrLoss: 0,
          sharesSold: 0,
        },
        {
          raw: '2024-02-27;18:34:09;Cancelled;"SCAL5z7RFZTfMex";"Marathon Digital";Security;Buy;US5657881067;0;0,00;0,00;0,00;0,00;EUR',
          time: parseTime('2024-02-27', '18:34:09'),
          status: "Cancelled",
          reference: "SCAL5z7RFZTfMex",
          description: "Marathon Digital",
          assetType: "Security",
          type: "Buy",
          isin: "US5657881067",
          shares: 0,
          price: 0,
          amount: 0,
          fee: 0,
          tax: 0,
          currency: "EUR",
          gainOrLoss: 0,
          sharesSold: 0,
        },
        {
          raw: '2024-03-28;01:00:00;Executed;"52024001";"KKT-Abschluss";Cash;Interest;;;;-164,02;0,00;;EUR',
          time: parseTime('2024-03-28', '01:00:00'),
          status: "Executed",
          reference: "52024001",
          description: "KKT-Abschluss",
          assetType: "Cash",
          type: "Interest",
          isin: "",
          shares: 0,
          price: 0,
          amount: -164.02,
          fee: 0,
          tax: 0,
          currency: "EUR",
          gainOrLoss: 0,
          sharesSold: 0,
        },
        {
          raw: '2024-04-10;07:44:56;Pending;"HESGED2FIZEJCLKM";"PRIME+ subscription";Cash;Fee;;;;-4,99;0,00;;EUR',
          time: parseTime('2024-04-10', '07:44:56'),
          status: "Pending",
          reference: "HESGED2FIZEJCLKM",
          description: "PRIME+ subscription",
          assetType: "Cash",
          type: "Fee",
          isin: "",
          shares: 0,
          price: 0,
          amount: -4.99,
          fee: 0,
          tax: 0,
          currency: "EUR",
          gainOrLoss: 0,
          sharesSold: 0,
        },
      ],
      errors: [],
    });
  });
});

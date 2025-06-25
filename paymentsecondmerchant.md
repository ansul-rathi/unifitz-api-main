## Global public parameters
#### Global Header parameters
Parameter name | Sample value | Parameter description
--- | --- | ---
No parameters
#### Global Query parameters
Parameter name | Sample value | Parameter description
--- | --- | ---
No parameters
#### Global Body parameters
Parameter name | Sample value | Parameter description
--- | --- | ---
No parameters
#### Global authentication method
```text
noauth
```
#### Global pre-execution script
```javascript
No pre-execution script
```
#### Global post-execution script
```javascript
No post-execution script
```
## /Signature description
```text
## Test KEY
accessKey: tw58ui0z60yYhaCTyROy6g

accessSecret: IwoScoHCG0C6cUf3N5qDJg
```
# Signature Description

### OpenAPI Signature Process

When requesting, the client needs to generate a signature Signature according to the following steps and add public parameters:

Public request parameters

Add Header request parameters based on the original request

`accessKey`: identity

`timestamp`: timestamp, accurate to seconds

`nonce`: unique random number, a 6-digit random number is recommended

`sign`: signature data (see the "Calculate Signature" section)

#### Calculate Signature

Sort the parameters in the request in the following order, and concatenate each parameter with & (no spaces in between):

`method & url & accessKey & timestamp & nonce`

`method` needs to be capitalized, such as: GET

`url` removes the protocol, domain name, and parameters, and starts with /, such as: /api/demo/helloWord

Use the HMAC-SHA256 protocol to create a hash-based message authentication code (HMAC), use `appSecret` as the key, calculate the signature of the above concatenated parameters, and encode the signature in Base-64

HMAC-SHA256 online calculation:

https://1024tools.com/hmac

#### Example

For example: Query merchant balance

Concatenation result `GET&/api/merchant/Balance&tw58ui0z60yYhaCTyROy6g&1721916124&634216`

accessSecret: `IwoScoHCG0C6cUf3N5qDJg`

You can view the merchant balance query interface and make online adjustments

![image.png](https://img.cdn.apipost.cn/client/user/1324143/avatar/78805a221a988e79ef3f42d7c5bfd41866a25b5221c7f.png "image.png")
```
## /Merchant
```text
No description
```
#### Header parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Query parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Body parameter
Parameter name | Example value | Parameter description
--- | --- |---
No parameters
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
##/Merchant/Check balance
```text
No description
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/merchant/Balance

#### Request method
> GET

#### Content-Type
> none

#### Request Header parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1721916124 | String | Yes | 10-digit timestamp
nonce | 634216 | String | Yes | 6-digit random string
sign | 4RYaNXUjiLS473r4yGizHTqRcy1rtTdETPSH9Gdhpf8= | String | Yes | Signature result accessKey online tool https://1024tools.com/hmac
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": [
{
"currency":"inr",
"balance": 100000
}
],
"time": "2024-07-25 19:29:35"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Array | Asset list
result.currency | inr | String | Currency name
result.balance | 100000 | Integer | Balance
time | 2024-07-25 19:29:35 | String | Message time
## / Collection
```text
No description
```
#### Header parameter
Parameter name | Example value |Parameter description
--- | --- | ---
No parameters
#### Query parameters
Parameter name | Example value | Parameter description
--- | --- | ---
No parameters
#### Body parameters
Parameter name | Example value | Parameter description
--- | --- | ---
No parameters
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
##/Collection/Create collection order
```text
## Currency type

type: ['inr', 'trx', 'usdt']

inr: Rupee

trx: TRX

usdt: USDT

## Status enumeration
status

created: created,The status after the merchant successfully pulls the order

paying : paying, the status after the real user visits the cashier

timeOut : timeout, order timeout

success : success, user payment success

fail : failure, user payment failure

cancel : cancel, user cancels payment

exception : exception, order exception
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/create

#### Request method
> POST

#### Content-Type
> json

#### Request Header Parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp |1721123166 | String | Yes | 10-digit timestamp
nonce | 627787 | String | Yes | 6-digit random string
sign | Pq7mRypykcwsrpU8RGhBO5AWqiRz+sLFnI/bf8ucwkM= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body parameters
```javascript
{
"McorderNo": "41453135443316534011",
"Amount": "1000",
"Type": "inr",
"ChannelCode": "71001",
"CallBackUrl": "http://127.0.0.1:5005/api/notify/transaction",
"JumpUrl":"http://127.0.0.1:5005/api/notify/transaction"
}
```
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
McorderNo | 41874553643314011011 | String | Yes | Merchant order number, no duplication allowed
Amount | 1000 | String | Yes | Collection amount, up to two decimal places are supported, and decimal places beyond two are automatically truncated
Type | inr | String | Yes | Currency type, (see instructions)
ChannelCode | 71001 | String | Yes | The channel code you bound
CallBackUrl | http://127.0.0.1:5005/api/notify/transaction | String | Yes | Order message callback address
JumpUrl |http://127.0.0.1:5005/api/notify/transaction | String | Yes | Supports cashier redirection address after completion (usually points to the user access address of the merchant order)
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"orderNo": "20240525203241417010001",
"merchantOrder": "418745536433411011",
"amount": 1000,
"status": "created","type": "inr",
"fee": 65,
"payUrl": "https://pay.tkusdtmanage.com/20240525203241417010001",
"expireTime": 0
},
"time": "2024-05-25 20:32:43"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.orderNo | 20240525203241417010001 | String | Platform order number
result.merchantOrder | 418745536433411011 | String | Merchant order number
result.amount | 1000 | Integer | Amount,
result.status | created | String | Order status (query status description), the order status will change to paying when accessing the cashier, the order timeout, there will be a callback when success or failure, the CallBackUrl parameter determines
result.type | inr | String | Currency type
result.fee | 65 | Integer | Collection fee
result.payUrl | https://pay.tkusdtmanage.com/20240525203241417010001 | String | Cashier address
result.expireTime | 0 | Integer | Timeout time
time | 2024-05-25 20:32:43 | String | Message time
## /Collection/Create a collection order-synchronous (for Sifang)
```text
# Current interface. Please do not use it if it is not a Sifang system

## Currency type

type: ['inr', 'trx', 'usdt']

inr: Rupee

trx: TRX

usdt: USDT

## Status enumeration

status

created: created, the status after the merchant successfully pulls the order

paying: paying, the status after the real user visits the cashier

timeOut: timeout, order timeout

success: success, user payment success

fail: failure, user payment failure

cancel: cancel, user cancels payment

exception: exception, order exception

```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/createwait

#### Request method
> POST

#### Content-Type
> json

#### Request Header Parameters
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1719048598 | String | Yes | 10-digit timestamp
nonce | 1719048598 | String | Yes | 6-digit random string
sign | +a0dsCtrfCBtKEMIYMt3/Ea2Cqlg8g5PII5FaU4C7Vw= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"McorderNo": "4187455311643113411011",
"Amount": "50000",
"Type": "inr",
"ChannelCode": "71001",
"CallBackUrl": "http://127.0.0.1:5005/api/notify/transaction",
"JumpUrl": "http://127.0.0.1:5005/api/notify/transaction"
}
```
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
McorderNo | 41874553643314011011 | String | Yes | Merchant order number, no duplication allowed
Amount | 1000 | String | Yes | Collection amount, up to two decimal places are supported, Automatically truncate beyond two digits
Type | inr | String | Yes | Currency type, (see instructions)
ChannelCode | 71001 | String | Yes | The channel code you bound
CallBackUrl | http://127.0.0.1:5005/api/notify/transaction | String | Yes | Order message callback address
JumpUrl | http://127.0.0.1:5005/api/notify/transaction | String | Yes | Supports cashier jump address after completion (usually points to the user access address of the merchant order)
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Successful response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"orderNo": "20240525203241417010001",
"merchantOrder": "418745536433411011",
"amount": 1000,
"status": "created",
"type": "inr",
"fee": 65,
"payUrl": "https://pay.tkusdtmanage.com/20240525203241417010001",
"expireTime": 0
},
"time": "2024-05-25 20:32:43"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.orderNo | 20240525203241417010001 | String | Platform order number
result.merchantOrder | 418745536433411011 | String | Merchant order number
result.amount | 1000 | Integer | Amount,
result.status | created | String | Order status
result.type | inr | String | Currency type
result.fee | 65 | Integer | Collection fee
result.payUrl | https://pay.tkusdtmanage.com/20240525203241417010001 | String | Cashier address
result.expireTime | 0 | Integer | Timeout
time | 2024-05-25 20:32:43 | String | Message time
## /Collection/Collection order query
```text
## Currency type

type: ['inr', 'trx', 'usdt']

inr: Rupee

trx: TRX

usdt: USDT

## Status enumeration

status

created: created, the status after the merchant successfully pulls the order

paying: paying, the status after the real user visits the cashier

timeOut: timeout, order timeout

success: success, user payment success

fail: failure, user payment failure

cancel: cancel, user cancels payment

exception: exception, order exception

```
#### Interface status

> Completed

#### Interface URL
> http://localhost:5005/api/order/queryorder

#### Request method
> POST

#### Content-Type
> json

#### Request Header Parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716649330 | String | Yes | 10-digit timestamp
nonce | 1716649330 | String | Yes | 6-digit random string
sign | i4vUNSVwfKOtFYn5RmH2zuL+KuLedSm5Vot8cCcrXC4= | String | Yes | Signature result accessKey Online Tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"orderNo": "418745536433411011",
}
```
Parameter Name | Example Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
orderNo | 418745536433411011 | String | Yes | Platform Order Number, or Merchant Order Number
#### Authentication Method
```text
noauth
```
#### Pre-execution Script
```javascript
No pre-execution script
```
#### Post-execution Script
```javascript
No post-execution script
```
#### Success Response Example
```javascript
{
"orderno": "20240528150416746010002",
"merchantorder": "41870855396185911",
"currency": "inr",
"amount": 1000,
"fee": 65,
"proof": "123456789012",
"status": "success",
"payee": "abc@air",
"bankname": "iob",
"bankaccount": "123456789",
"createtime": "2024-05-28 15:04:16",
"updatetime": "2024-05-28 15:06:28"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
orderno | 20240528150416746010002 | String | Platform order number
merchantorder | 41870855396185911 | String | Merchant order number
currency | inr | String | Currency
amount | 1000 | Integer | Amount
fee | 65 | Integer | Handling fee
proof | 123456789012 | String | Proof: UTR for inr and hash for TRON
status | success | String | Status
payee | abc@air | String | Payee upi
bankname | iob | String | Bank name
bankaccount | 123456789 | String | Bank card number
createtime | 2024-05-28 15:04:16 | String | Creation time
updatetime | 2024-05-28 15:06:28 | String | Update time
## /Collection/Collection callback
```text
## Callback description
If the callback is successfully received and the string `success` is returned, the system considers the callback successful and does not call back
If it is not `success`, the system considers the callback failed and will delay sending the callback again, a total of 8 times, with delay intervals of 0 2 4 8 ... minutes

## Currency type

type: ['inr' , 'trx', 'usdt']

inr: rupee

trx: TRX

usdt: USDT

## Status enumeration

status

created : created, the status after the merchant successfully pulls the order

paying : paying, the status after the real user visits the cashier

timeOut : timeout, order timeout

success : success, user payment successful

fail : failure, user payment failed

cancel : cancel, user cancels payment

exception : Abnormal, order abnormal
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/youurl

#### Request method
> POST

#### Content-Type
> json

#### Request Header parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716649330 | String | Yes | 10-digit timestamp
nonce | 342341 | String | Yes | 6-digit random string
sign | i4vUNSVwfKOtFYn5RmH2zuL+KuLedSm5Vot8cCcrXC4= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"orderno": "20240528150416746010002",
"merchantorder": "41870855396185911",
"currency": "inr",
"amount": 1000,
"fee": 65,
"proof": "123456789012",
"status": "success",
"createtime": "2024-05-28 15:04:16",
"updatetime": "2024-05-28 15:06:28"
}
```
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
orderno | 20240528150416746010002 | String | Yes | Platform order number
merchantorder | 41870855396185911 | String | Yes | Merchant order number
currency | inr | String | Yes | Currency name
amount | 1000 | Integer | Yes | Amount
fee | 65 | Integer | Yes | Agency fee
proof | 123456789012 | String | Yes | UTR for proof inr and hash for TRON
status | success | String | Yes | Status
createtime | 2024-05-28 15:04:16 | String | Yes | Creation time,
updatetime | 2024-05-28 15:06:28 | String | Yes | Last updated time
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
"success"
```
## /Collection/Make up order
```text
No description
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/makeup

#### Request method
> POST

#### Content-Type
> json

#### Request Header parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716555471 | String | Yes | 10-digit timestamp
nonce | 1716555471 | String | Yes | 6-digit random string
sign | RXhk3omNdIzx3HJpScP87GJViISG1TUWsd/hSbyJm/8= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"OrderNo": "20240524182129796010005",
"utr": "343767445476",
}
```
Parameter Name | Example Value | Parameter Type | Required | Parameter description
--- | --- | --- | --- | ---
OrderNo | 20240524182129796010005 | String | Yes | Order number
utr | 343767445476 | String | Yes | utr
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": "Successful, waiting for callback",
"time": "2024-05-24 18:28:03"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | Successful, waiting for callback | String | -
time | 2024-05-24 18:28:03 | String | Message time
## /Collection/Query UPI
```text
No description yet
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/queryupi

#### Request method
> POST

#### Content-Type
> json

#### Request Header parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716650080 | String | Yes | 10-digit timestamp
nonce | 1716650080 | String | Yes | 6-digit random string
sign | zrSuvgWfY7+4tiv0W3ttuGwk3CxvmkR+Q6Mv0SDMI+U= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"upi": "mahirverma754@axl",
}
```
Parameter Name | Sample Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
upi | mahirverma754@axl | String | Yes | -
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"upi": "mahirverma754@axl",
"status": "exist"
},
"time": "2024-05-25 20:44:53"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.upi | mahirverma754@axl | String | -
result.status | exist | String | Existence: exist exists, noexist does not exist, error query failed
time | 2024-05-25 20:44:53 | String | Message time
## /Collection/Query UTR
```text
### Status enumeration

WaitMakeup = 1, //Waiting for order

Makeuped = 2, //Already collected

NotExist = 3, //UTR does not exist
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/queryutr

#### Request method
> POST

#### Content-Type
> json

#### Request Header Parameters
Parameter Name | Example Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716650232 | String | Yes | 10-digit timestamp
nonce | 1716650232 | String | Yes | 6-digit random string
sign | RO3dkOE9mcR1Pf+kllfMhm4hVZbcgdr3wBK3qq168TU= | String | Yes | Signature Result accessKey Online Tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"utr": "343767445476"
}
```
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | ---| --- | ---
utr | 343767445476 | String | Yes | -
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"utr": "343767445476",
"status": "makeuped",
"orderNo": "20240524182129796010005",
"message": "UTR completed",
"amount": 1000
},
"time": "2024-05-25 20:47:26"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.utr | 343767445476 | String | utr
result.status | makeuped | String | UTR status
result.orderNo | 20240524182129796010005 | String | Matched order number
result.message | UTR completed | String | Description
result.amount | 1000 | Integer | Amount,
time | 2024-05-25 20:47:26 | String | Message time
## / Payment on behalf of others
```text
No description
```
#### Header parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Query parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Body parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
## / Payment on behalf of others/Create payment on behalf of others
```text
## Currency type

type: ['inr' , 'trx', 'usdt']

inr: rupee

trx: TRX

usdt: USDT

## Status description

status:

created: created,

waiting: waiting for processing,

paying: paying,

success: successful,

fail: failed,

overrule: rejected,

```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/payorder/create

#### Request method
> POST

#### Content-Type
> json

#### Request Header parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716649930 | String | Yes | 10-digit timestamp
nonce | 1716649930 | String | Yes | 6-digit random string
sign | lcgPEvtOFNUJzhXapyMxzrOz2KrKJPrKOrnWhbemnzs= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"McorderNo": "874381985331514817",
"Amount": "500",
"Type": "inr",
"ChannelCode": "71001",
"Address": "TJ1aCzwh29PuxUMjQHoDj6hWg6xuY3odQC",
"name": "TURBO SERVICES, TURBO SERVICES",
"BankName": "SBI",
"BankAccount": "4180002100015798",
"Ifsc": "PUNB0418000",
"NotifyUrl": "http://127.0.0.1:5005/api/notify/transaction"
}
```
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
McorderNo | 87438198533514817 | String | Yes | Merchant order number, no duplication allowed
Amount | 500 | String | Yes | Transfer amount, maximum two decimal places, automatically truncated if greater than two decimal places
Type | inr | String | Yes | Currency type
ChannelCode | 71001 | String | Yes | The channel code you bound
Address | TJ1aCzwh29PuxUMjQHoDj6hWg6xuY3odQC | String | Yes | Valid for trx, or usdt payment
name | TURBO SERVICES, TURBO SERVICES | String | Yes | Payee name (inr valid)
BankName | SBI | String | Yes | Bank name (inr valid)
BankAccount | 4180002100015798 | String | Yes | Bank card number (inr valid)
Ifsc | PUNB0418000 | String | Yes | IFSC (inr valid)
NotifyUrl | http://127.0.0.1:5005/api/notify/transaction | String | Yes | Payment order notification address
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"orderNo": "20240525204230488010002",
"merchantOrder": "874381985331514817",
"amount": 500,
"status": "created",
"currency": "inr",
"fee": 21
},
"time": "2024-05-25 20:42:32"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.orderNo | 20240525204230488010002 | String | Return order number
result.merchantOrder | 874381985331514817 | String | Merchant order number
result.amount | 500 | Integer | Amount,
result.status | created | String | Order status, (query description)
result.currency | inr | String | Currency type
result.fee | 21 | Integer | Collection fee
time | 2024-05-25 20:42:32 | String | Message time
## /Payment on behalf of others/Payment on behalf of others notification
```text
## Notification description
If the `success` string is returned after successfully receiving the notification, the system considers the notification successful and does not repeat the notification
If it is not `success`, the system considers the notification failed and will delay sending the notification again, a total of 8 times, with delay intervals of 0 2 4 8 ... minutes

## Currency type

type: ['inr' , 'trx', 'usdt']

inr: rupee

trx: TRX

usdt: USDT

## Status
status :

created : created,

waiting : waiting for processing,

paying : paying,

success : success,

fail : failure,

overrule : rejected,
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/youurl

#### Request method
> POST

#### Content-Type
> json

#### Request Header parameters
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | -
timestamp | 1716649930 | String | Yes | -
nonce | 12311 | String | Yes | -
sign | lcgPEvtOFNUJzhXapyMxzrOz2KrKJPrKOrnWhbemnzs= | String | Yes | -
#### Request Body parameters
```javascript
{
"orderno": "20240528175929519010002",
"merchantorder": "8743819853311514817",
"currency": "inr",
"amount": 500,
"fee": 21,
"proof": "123456789012",
"status": "fail",
"createtime": "2024-05-28 17:59:29",
"updatetime": "2024-05-28 18:04:18"
}
```
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
orderno | 20240528175929519010002 | String | Yes | Platform order number
merchantorder | 8743819853311514817 | String | Yes | Merchant order number
currency | inr | String | Yes | Currency name
amount | 500 | Integer | Yes | Amount
fee | 21 | Integer | Yes | Payment collection
proof |123456789012 | String | Yes | UTR for credentials inr, hash for TRON
status | fail | String | Yes | Status
createtime | 2024-05-28 17:59:29 | String | Yes | Creation time,
updatetime | 2024-05-28 18:04:18 | String | Yes | Last update time
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
"success"
```
## /Payment/Payment order query
```text
## Currency type

type: ['inr' , 'trx', 'usdt']

inr: rupee

trx: TRX

usdt: USDT

## Status
status:

created: created,

waiting: waiting for processing,

paying: paying,

success: successful,

fail: failed,

overrule: rejected,

```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/payorder/queryorder

#### Request method
> POST

#### Content-Type
> json

#### Request Header Parameters
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
accessKey | tw58ui0z60yYhaCTyROy6g | String | Yes | User accessKey
timestamp | 1716649930 | String | Yes | 10-digit timestamp
nonce | 1716649930 | String | Yes | 6-digit random string
sign | lcgPEvtOFNUJzhXapyMxzrOz2KrKJPrKOrnWhbemnzs= | String | Yes | Signature result accessKey Online tool https://1024tools.com/hmac
#### Request Body Parameters
```javascript
{
"orderNo": "874381985331514817",
}
```
Parameter Name | Sample Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
orderNo | 874381985331514817 | String | Yes | Platform order number, or merchant order number
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"orderno": "20240528175929519010002",
"merchantorder": "8743819853311514817",
"currency": "inr",
"amount": 500,
"proof": "123456789012",
"fee": 21,
"status": "fail",
"createtime": "2024-05-28 17:59:29",
"updatetime": "2024-05-28 18:04:18"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
orderno | 20240528175929519010002 | String | Platform order number
merchantorder | 8743819853311514817 | String | Merchant order number
currency | inr | String | Currency
amount | 500 | Integer | Amount
proof | - | String | Proof inr is UTR, TRON is hash
fee | 21 | Integer | Handling fee
status | fail | String | Status
createtime | 2024-05-28 17:59:29 | String | Creation time
updatetime | 2024-05-28 18:04:18 | String | Update time
## /Cashier API
```text
No description
```
#### Header parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Query parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Body parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameter
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
## /Cashier API/First Order Query
```text
No description
```
#### Interface Status
> Completed

#### Interface URL
> http://localhost:5005/api/order/query

#### Request Method
> POST

#### Content-Type
> json

#### Request Body Parameters
```javascript
{
"OrderNo": "20240812120623960010003",
"PayerId": "uff33f231"
}
```
Parameter Name | Example Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
OrderNo | 20240525200357163010002 | String | Yes | Order Number
PayerId | uff33f231 | String | Yes | Payee ID
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"orderNo": "20240525200357163010002",
"amount": 1000,
"cashierInfo": {
"qr": "upi://pay?pa=mahirverma754@axl&pn=Payment for Ashish Verma&am=1000.00&cu=INR&tid=2024052520041091866646&tn=slPD7NM8",
"copy": "mahirverma754@axl"
},
"status": "timeout",
"type": "inr",
"upstreamPayUrl": "",
"expireTime": 0,
"jumpUrl": "http://127.0.0.1:5005/api/notify/transaction"
},
"time": "2024-05-25 20:56:53"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.orderNo | 20240525200357163010002 | String | Order number
result.amount | 1000 | Integer | Amount,
result.cashierInfo | - | Object | -
result.cashierInfo.qr | upi://pay?pa=mahirverma754@axl&pn=Payment for Ashish Verma&am=1000.00&cu=INR&tid=2024052520041091866646&tn=slPD7NM8 | String | -
result.cashierInfo.copy | mahirverma754@axl | String | -
result.status | timeout | String | -
result.type | inr | String | -
result.upstreamPayUrl | - | String | -
result.expireTime | 0 | Integer | Timeout (seconds)
result.jumpUrl | http://127.0.0.1:5005/api/notify/transaction | String | -
time | 2024-05-25 20:56:53 | String | Message time
## /Cashier API/Order Polling
```text
No description
```
#### Interface Status
> Completed

#### Interface URL
> http://localhost:5005/api/order/QueryDetail

#### Request Method
> POST

#### Content-Type
> json

#### Request Body Parameters
```javascript
{
"OrderNo": "20240525200357163010002",
"PayerId": "uff33f231"
}
```
Parameter name | Example value | Parameter type | Required | Parameter description
--- | --- | --- | --- | ---
OrderNo | 20240525200357163010002 | String | Yes | Order number
PayerId | uff33f231 | String | Yes | Payee ID
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 200,
"type": "success",
"message": "",
"result": {
"orderNo": "30cbfe0d3e4440878f5800c2558cf2b7",
"formAddress": "TU7ukKGPBSyxEDtzNXfCfdwhfrZdar1GSU",
"toAddress": "TYtgtKBQ2LqFJFUhEm2vqUZoVgEHA19Qbq",
"amount": 1.2,
"type": "usdt",
"status": "pending",
"createTime": "2023-11-26 13:44:44"
},
"time": "2023-11-26 13:44:44"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 200 | Integer | Operation status Non-200 Failure
type | success | String | API operation status
message | - | String | Operation message
result | - | Object | -
result.orderNo | 30cbfe0d3e4440878f5800c2558cf2b7 | String | Return order number
result.formAddress | TU7ukKGPBSyxEDtzNXfCfdwhfrZdar1GSU | String | Transfer address
result.toAddress | TYtgtKBQ2LqFJFUhEm2vqUZoVgEHA19Qbq | String | Receiving address
result.amount | 1.2 | Number | Transfer amount,
result.type | usdt | String | Currency type, (query type code)
result.status | pending | String | order status, (query status code)
result.createTime | 2023-11-26 13:44:44 | String | creation time
time | 2023-11-26 13:44:44 | String | message time
## /Cashier API/Submit UTR
```text
No description yet
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/submitproof

#### Request method
> POST

#### Content-Type
> json

#### Request Body parameters
```javascript
{
"orderNo": "20240525210448500010001",
"proof": "873336522112",
"PayerId": "1211122"
}
```
Parameter name | Example value | Parameter type | Required or not | Parameter description
--- | --- | --- | --- | ---
OrderNo | 20240525200357163010002 | String | Yes | Order number
PayerId | uff33f231 | String | Yes | Payee ID
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 400,
"type": "error",
"message": "Payment is pending. Please wait.",
"time": "2024-05-25 21:05:14"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 400 | Integer | Submit the credentials and confirm successfully, return 200, otherwise return 400
type | error | String | API operation status
message | Payment is pending. Please wait. | String | Operation message
time | 2024-05-25 21:05:14 | String | Message time
## /Cashier API/Cancel payment
```text
No description
```
#### Interface status
> Completed

#### Interface URL
> http://localhost:5005/api/order/Cancel

#### Request method
> POST

#### Content-Type
> json

#### Request Body Parameters
```javascript
{
"orderNo": "20240525210448500010001",
"PayerId": "1211122"
}
```
Parameter Name | Example Value | Parameter Type | Required | Parameter Description
--- | --- | --- | --- | ---
OrderNo | 20240525200357163010002 | String | Yes | Order Number
PayerId | uff33f231 | String | Yes | Payee ID
#### Authentication Method
```text
noauth
```
#### Pre-execution Script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
#### Success response example
```javascript
{
"code": 400,
"type": "error",
"message": "Payment is pending. Please wait.",
"time": "2024-05-25 21:05:14"
}
```
Parameter name | Example value | Parameter type | Parameter description
--- | --- | --- | ---
code | 400 | Integer | Success, return 200 Other returns 400
type | error | String | API operation status
message | Payment is pending. Please wait. | String | Operation message
time | 2024-05-25 21:05:14 | String | Message time
## /Example
```text
No description
```
#### Header parameter
Parameter name | Example value | Parameter description
--- | --- | ---
No parameters
#### Query parameters
Parameter name | Example value | Parameter description
--- | --- | ---
No parameters
#### Body parameters
Parameter name | Example value | Parameter description
--- | --- | ---
No parameters
#### Authentication method
```text
noauth
```
#### Pre-execution script
```javascript
No pre-execution script
```
#### Post-execution script
```javascript
No post-execution script
```
## /Example/Merchant balance query
```text
## Test KEY
accessKey: tw58ui0z60yYhaCTyROy6g

accessSecret: IwoScoHCG0C6cUf3N5qDJg

## API address
https://api.tkusdtapi.com

This is a simulated address, please replace the address of the official site

## Request part example
Full request URL: https://api.tkusdtapi.com/api/merchant/Balance

Method: GET

#### Protocol header:

accessKey: tw58ui0z60yYhaCTyROy6g
timestamp: 1722165968
nonce: 873492
sign: kM/VrN8JcBixtSQxdSo8YE6j8eH+iUArdoU423wFFUI=

#### Signature string
GET&/api/merchant/Balance&tw58ui0z60yYhaCTyROy6g&1722165968&873492
**Note: timestamp required 10 digits, accurate to the second**

**nonce: 6 digits are not mandatory, letters can also be included**

Signature splicing principle:

Request method & interface path & accessKey & 10-digit current timestamp & random value

`method & url & accessKey & timestamp & nonce`

#### Signature result

kM/VrN8JcBixtSQxdSo8YE6j8eH+iUArdoU423wFFUI=

Request example image:

![image.png](https://img.cdn.apipost.cn/client/user/1324143/avatar/78805a221a988e79ef3f42d7c5bfd41866a62b74ccce2.png "image.png")

#### Return result

{
"code": 200,
"type": "success",
"message": "",
"result": [
{
"currency": "inr",
"balance": 100000
}
],
"time": "2024-07-28 16:58:29"
}

For details, please check the interface document again
```